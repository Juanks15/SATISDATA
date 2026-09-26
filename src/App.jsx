import { useEffect, useMemo, useState } from 'react';
import './App.css';

import { useSincronizacion } from './hooks/useSincronizacion';

import PanelFuncionario from './components/PanelFuncionario';
import HistorialEncuestas from './components/HistorialEncuestas';
import DetalleEncuesta from './components/DetalleEncuesta';
import Question from './components/Question';

import { preguntasDemo } from './data/preguntasDemo';
import Autenticacion from './auth/Autenticacion';
import {
  obtenerDepartamentos,
  obtenerMunicipios,
} from './services/divipola';

import { useBorradorEncuesta } from './hooks/useBorradorEncuesta';
import { useEncuestas } from './hooks/useEncuestas';

function App() {
  // ==========================================
  // ESTADOS PRINCIPALES
  // ==========================================

  const [vista, setVista] = useState('inicio');

  const [
    encuestaSeleccionada,
    setEncuestaSeleccionada,
  ] = useState(null);

  const [busqueda, setBusqueda] = useState('');

  // ==========================================
  // FORMULARIO GENERAL
  // ==========================================

  const [formulario, setFormulario] = useState({
    departamento: '',
    municipio: '',
    observacion: '',
    departamentoCodigo: '',
    municipioCodigo: '',
    municipioCodigoCompleto: '',
  });

  // ==========================================
  // CATÁLOGO GEOGRÁFICO
  // ==========================================

  const [departamentos, setDepartamentos] =
    useState([]);

  const [municipios, setMunicipios] =
    useState([]);

  const [
    cargandoDepartamentos,
    setCargandoDepartamentos,
  ] = useState(false);

  const [
    cargandoMunicipios,
    setCargandoMunicipios,
  ] = useState(false);

  const [
    errorDepartamentos,
    setErrorDepartamentos,
  ] = useState('');

  const [
    errorMunicipios,
    setErrorMunicipios,
  ] = useState('');

  // ==========================================
  // RESPUESTAS
  // ==========================================

  const [respuestas, setRespuestas] =
    useState({});

  // ==========================================
  // GESTIÓN DE BORRADORES
  // ==========================================

  const {
    borradorId,
    borradorEncontrado,
    mostrarBorrador,
    guardandoBorrador,
    iniciarBorrador,
    activarBorrador,
    descartarBorrador:
      descartarBorradorHook,
    finalizarBorrador,
  } = useBorradorEncuesta({
    formulario,
    respuestas,
    vista,
  });

  // ==========================================
  // ENCUESTAS
  // ==========================================

  const {
    encuestas,
    cargandoEncuestas,
    errorEncuestas,
    cargarEncuestas,
    guardarEncuesta:
      guardarEncuestaService,
    obtenerEncuesta,
    eliminarEncuesta,
  } = useEncuestas();

  // ==========================================
  // SINCRONIZACIÓN
  // ==========================================

  const {
    online,
    pendientes,
    sincronizando,
    errorSincronizacion,
    sincronizar,
  } = useSincronizacion();

  // ==========================================
  // ÚNICA FUENTE DE PREGUNTAS
  // ==========================================

  const preguntas = useMemo(
    () =>
      preguntasDemo
        .filter(
          (pregunta) => pregunta.activa
        )
        .sort(
          (a, b) => a.orden - b.orden
        ),
    []
  );

  // ==========================================
  // PROGRESO DE LA ENCUESTA
  // ==========================================

  const preguntasObligatorias =
    preguntas.filter(
      (pregunta) => pregunta.obligatoria
    );

  const preguntasRespondidas =
    preguntasObligatorias.filter(
      (pregunta) => {
        const valor =
          respuestas[pregunta.id];

        return (
          valor !== undefined &&
          valor !== null &&
          valor !== '' &&
          !(
            Array.isArray(valor) &&
            valor.length === 0
          )
        );
      }
    ).length;

  const progreso =
    preguntasObligatorias.length > 0
      ? Math.round(
          (preguntasRespondidas /
            preguntasObligatorias.length) *
            100
        )
      : 0;

  // ==========================================
  // CARGAR DEPARTAMENTOS
  // ==========================================

  useEffect(() => {
    cargarDepartamentos();
  }, []);

  // ==========================================
  // CARGAR DEPARTAMENTOS
  // ==========================================

  const cargarDepartamentos = async () => {
    try {
      setCargandoDepartamentos(true);
      setErrorDepartamentos('');

      const datos =
        await obtenerDepartamentos();

      setDepartamentos(datos);
    } catch (error) {
      console.error(
        'Error cargando departamentos:',
        error
      );

      setErrorDepartamentos(
        'No fue posible cargar los departamentos.'
      );
    } finally {
      setCargandoDepartamentos(false);
    }
  };

  // ==========================================
  // CAMBIAR DEPARTAMENTO
  // ==========================================

  const cambiarDepartamento = async (
    codigoDepartamento
  ) => {
    const departamentoSeleccionado =
      departamentos.find(
        (departamento) =>
          departamento.codigo ===
          codigoDepartamento
      );

    const nombreDepartamento =
      departamentoSeleccionado?.nombre || '';

    setFormulario((datos) => ({
      ...datos,

      departamento:
        nombreDepartamento,

      departamentoCodigo:
        codigoDepartamento,

      municipio: '',
      municipioCodigo: '',
      municipioCodigoCompleto: '',
    }));

    setMunicipios([]);
    setErrorMunicipios('');

    if (!codigoDepartamento) {
      return;
    }

    try {
      setCargandoMunicipios(true);
      setErrorMunicipios('');

      const datos =
        await obtenerMunicipios(
          codigoDepartamento
        );

      setMunicipios(datos);
    } catch (error) {
      console.error(
        'Error cargando municipios:',
        error
      );

      setErrorMunicipios(
        'No fue posible cargar los municipios.'
      );
    } finally {
      setCargandoMunicipios(false);
    }
  };

  // ==========================================
  // CAMBIAR MUNICIPIO
  // ==========================================

  const cambiarMunicipio = (
    codigoMunicipioCompleto
  ) => {
    const municipioSeleccionado =
      municipios.find(
        (municipio) =>
          municipio.codigoCompleto ===
          codigoMunicipioCompleto
      );

    setFormulario((datos) => ({
      ...datos,

      municipio:
        municipioSeleccionado?.nombre || '',

      municipioCodigo:
        municipioSeleccionado?.codigo || '',

      municipioCodigoCompleto:
        municipioSeleccionado?.codigoCompleto ||
        '',
    }));
  };

  // ==========================================
  // INICIAR ENCUESTA
  // ==========================================

  const iniciarEncuesta = async () => {
    try {
      const resultado =
        await iniciarBorrador();

      if (
        resultado.tipo === 'existente'
      ) {
        return;
      }

      setFormulario({
        departamento: '',
        municipio: '',
        observacion: '',
        departamentoCodigo: '',
        municipioCodigo: '',
        municipioCodigoCompleto: '',
      });

      setMunicipios([]);
      setRespuestas({});
      setErrorDepartamentos('');
      setErrorMunicipios('');
      setVista('encuesta');
    } catch (error) {
      console.error(
        'Error iniciando encuesta:',
        error
      );

      alert(
        'No fue posible iniciar la encuesta.'
      );
    }
  };

  // ==========================================
  // CONTINUAR BORRADOR
  // ==========================================

  const continuarBorrador = async () => {
    if (!borradorEncontrado) {
      return;
    }

    try {
      const datosFormulario =
        borradorEncontrado.formulario || {};

      setFormulario({
        departamento:
          datosFormulario.departamento || '',

        municipio:
          datosFormulario.municipio || '',

        observacion:
          datosFormulario.observacion || '',

        departamentoCodigo:
          datosFormulario.departamentoCodigo || '',

        municipioCodigo:
          datosFormulario.municipioCodigo || '',

        municipioCodigoCompleto:
          datosFormulario.municipioCodigoCompleto ||
          '',
      });

      setRespuestas(
        borradorEncontrado.respuestas || {}
      );

      setErrorDepartamentos('');
      setErrorMunicipios('');

      if (
        datosFormulario.departamentoCodigo
      ) {
        const datosMunicipios =
          await obtenerMunicipios(
            datosFormulario.departamentoCodigo
          );

        setMunicipios(datosMunicipios);
      } else {
        setMunicipios([]);
      }

      activarBorrador(
        borradorEncontrado
      );

      setVista('encuesta');
    } catch (error) {
      console.error(
        'Error recuperando borrador:',
        error
      );

      alert(
        'No fue posible recuperar la encuesta.'
      );
    }
  };

  // ==========================================
  // DESCARTAR BORRADOR
  // ==========================================

  const descartarBorrador = async () => {
    if (!borradorEncontrado) {
      return;
    }

    const confirmar =
      window.confirm(
        '¿Está seguro de descartar esta encuesta en progreso? Esta acción eliminará el borrador.'
      );

    if (!confirmar) {
      return;
    }

    try {
      await descartarBorradorHook(
        borradorEncontrado.id
      );

      setFormulario({
        departamento: '',
        municipio: '',
        observacion: '',
        departamentoCodigo: '',
        municipioCodigo: '',
        municipioCodigoCompleto: '',
      });

      setMunicipios([]);
      setRespuestas({});
      setVista('inicio');
    } catch (error) {
      console.error(
        'Error descartando borrador:',
        error
      );

      alert(
        'No fue posible descartar el borrador.'
      );
    }
  };

  // ==========================================
  // ACTUALIZAR CAMPOS GENERALES
  // ==========================================

  const actualizarCampo = (
    campo,
    valor
  ) => {
    setFormulario((datos) => ({
      ...datos,
      [campo]: valor,
    }));
  };

  // ==========================================
  // ACTUALIZAR RESPUESTA
  // ==========================================

  const actualizarRespuesta = (
    preguntaId,
    valor
  ) => {
    setRespuestas((datos) => ({
      ...datos,
      [preguntaId]: valor,
    }));
  };

  // ==========================================
  // VALIDAR ENCUESTA
  // ==========================================

  const encuestaCompleta = () => {
    if (!formulario.departamento) {
      alert(
        'Seleccione un departamento.'
      );

      return false;
    }

    if (
      !formulario.municipio ||
      !formulario.municipio.trim()
    ) {
      alert(
        'Seleccione un municipio.'
      );

      return false;
    }

    for (const pregunta of preguntas) {
      if (!pregunta.obligatoria) {
        continue;
      }

      const valor =
        respuestas[pregunta.id];

      const respuestaVacia =
        valor === undefined ||
        valor === null ||
        valor === '' ||
        (
          Array.isArray(valor) &&
          valor.length === 0
        );

      if (respuestaVacia) {
        alert(
          `Por favor responda la pregunta ${pregunta.orden}.`
        );

        return false;
      }
    }

    return true;
  };

  // ==========================================
  // GUARDAR ENCUESTA
  // ==========================================

  const guardarEncuesta = async (
    event
  ) => {
    event.preventDefault();

    if (!encuestaCompleta()) {
      return;
    }

    try {
      const nuevaEncuesta = {
        codigo: `ENC-${Date.now()}`,

        fechaCreacion:
          new Date().toISOString(),

        departamento:
          formulario.departamento,

        departamentoCodigo:
          formulario.departamentoCodigo,

        municipio:
          formulario.municipio,

        municipioCodigo:
          formulario.municipioCodigo,

        municipioCodigoCompleto:
          formulario.municipioCodigoCompleto,

        funcionarioId: null,

        estadoSincronizacion:
          'pendiente',

        fechaSincronizacion: null,

        intentosSincronizacion: 0,

        observacion:
          formulario.observacion,
      };

      // ========================================
      // GUARDADO ATÓMICO
      // ========================================

      await guardarEncuestaService({
        encuesta: nuevaEncuesta,
        respuestas,
      });

      // ========================================
      // FINALIZAR BORRADOR
      // ========================================

      if (borradorId) {
        await finalizarBorrador();
      }

      setFormulario({
        departamento: '',
        municipio: '',
        observacion: '',
        departamentoCodigo: '',
        municipioCodigo: '',
        municipioCodigoCompleto: '',
      });

      setMunicipios([]);
      setRespuestas({});
      setBusqueda('');
      setVista('inicio');

      alert(
        'Encuesta guardada correctamente en el dispositivo.'
      );
    } catch (error) {
      console.error(
        'Error guardando encuesta:',
        error
      );

      alert(
        'No fue posible guardar la encuesta.'
      );
    }
  };

  // ==========================================
  // PANEL FUNCIONARIO
  // ==========================================

  const abrirPanelFuncionario = () => {
    setVista('funcionario');
  };

  const cerrarSesion = () => {
    setVista('inicio');
    setBusqueda('');
  };

  const buscarDesdeFuncionario = (
    texto
  ) => {
    setBusqueda(texto || '');
    setVista('inicio');
  };

  const encuestasRegistradas =
    encuestas.length;

  // ==========================================
  // BÚSQUEDA LOCAL
  // ==========================================

  const encuestasFiltradas =
    encuestas.filter((encuesta) => {
      const texto =
        busqueda
          .toLowerCase()
          .trim();

      if (!texto) {
        return true;
      }

      return (
        encuesta.codigo
          ?.toLowerCase()
          .includes(texto) ||

        encuesta.departamento
          ?.toLowerCase()
          .includes(texto) ||

        encuesta.municipio
          ?.toLowerCase()
          .includes(texto)
      );
    });

  // ==========================================
  // FORMATO FECHA
  // ==========================================

  const formatearFecha = (
    fecha
  ) => {
    if (!fecha) {
      return 'Sin fecha';
    }

    return new Date(
      fecha
    ).toLocaleDateString(
      'es-CO',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="app">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="header">

        <div className="header-content">

          <div className="logo">

            <span className="logo-icon">
              S
            </span>

            <div>
              <h1>
                SATISDATA
              </h1>

              <span>
                Sistema de encuestas
              </span>
            </div>

          </div>

          <div
            className={`connection-status ${
              online
                ? 'is-online'
                : 'is-offline'
            }`}
          >

            <span
              className={`status-dot ${
                online
                  ? 'online'
                  : 'offline'
              }`}
            ></span>

            <span>
              {online
                ? 'Conectado'
                : 'Sin conexión'}
            </span>

          </div>

        </div>

      </header>

      {/* ======================================
          CONTENIDO
      ====================================== */}

      <main className="main-content">

        {mostrarBorrador &&
          borradorEncontrado && (
            <div className="draft-overlay">

              <section
                className="draft-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="draft-title"
              >

                <div className="draft-modal-header">

                  <div className="draft-icon">
                    ✓
                  </div>

                  <div className="draft-title-area">

                    <span className="card-label">
                      ENCUESTA EN PROGRESO
                    </span>

                    <h2 id="draft-title">
                      Hay una encuesta pendiente
                    </h2>

                  </div>

                </div>

                <div className="draft-modal-body">

                  <p className="draft-description">
                    Encontramos una encuesta que quedó
                    guardada en este dispositivo. Puede
                    continuarla donde la dejó o descartarla
                    y comenzar una nueva.
                  </p>

                  <div className="draft-info">

                    <div>
                      <span>
                        Departamento
                      </span>

                      <strong>
                        {borradorEncontrado.formulario
                          ?.departamento ||
                          'Sin seleccionar'}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Municipio
                      </span>

                      <strong>
                        {borradorEncontrado.formulario
                          ?.municipio ||
                          'Sin seleccionar'}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Última actualización
                      </span>

                      <strong>
                        {new Date(
                          borradorEncontrado.fechaActualizacion
                        ).toLocaleString(
                          'es-CO',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </strong>
                    </div>

                  </div>

                  <div className="draft-progress">

                    <div className="draft-progress-header">

                      <span>
                        Progreso de la encuesta
                      </span>

                      <strong>
                        {Math.round(
                          (
                            preguntasObligatorias.filter(
                              (pregunta) => {
                                const valor =
                                  borradorEncontrado
                                    .respuestas?.[
                                    pregunta.id
                                  ];

                                return (
                                  valor !== undefined &&
                                  valor !== null &&
                                  valor !== '' &&
                                  !(
                                    Array.isArray(
                                      valor
                                    ) &&
                                    valor.length === 0
                                  )
                                );
                              }
                            ).length /
                              Math.max(
                                preguntasObligatorias.length,
                                1
                              )
                          ) * 100
                        )}
                        %
                      </strong>

                    </div>

                    <div className="draft-progress-bar">

                      <div
                        style={{
                          width: `${Math.round(
                            (
                              preguntasObligatorias.filter(
                                (pregunta) => {
                                  const valor =
                                    borradorEncontrado
                                      .respuestas?.[
                                      pregunta.id
                                    ];

                                  return (
                                    valor !== undefined &&
                                    valor !== null &&
                                    valor !== '' &&
                                    !(
                                      Array.isArray(
                                        valor
                                      ) &&
                                      valor.length === 0
                                    )
                                  );
                                }
                              ).length /
                                Math.max(
                                  preguntasObligatorias.length,
                                  1
                                )
                            ) * 100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

                <div className="draft-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      descartarBorrador
                    }
                  >
                    Descartar
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      continuarBorrador
                    }
                  >
                    Continuar encuesta
                  </button>

                </div>

              </section>

            </div>
          )}

        {/* ====================================
            INICIO
        ==================================== */}

        {vista === 'inicio' && (
          <>

            <section className="welcome">

              <span className="welcome-label">
                ENCUESTAS
              </span>

              <h2>
                Registro de encuestas
                <br />
                de satisfacción
              </h2>

              <p>
                Registre las encuestas
                directamente desde el
                dispositivo, incluso cuando
                no tenga conexión a Internet.
              </p>

            </section>

            <section className="dashboard">

              <button
                className="new-survey-card"
                type="button"
                onClick={
                  iniciarEncuesta
                }
              >

                <div className="card-icon">
                  +
                </div>

                <div className="card-content">

                  <span className="card-label">
                    REGISTRO
                  </span>

                  <h3>
                    Nueva encuesta
                  </h3>

                  <p>
                    Iniciar una nueva encuesta
                    de satisfacción.
                  </p>

                </div>

                <span className="arrow">
                  →
                </span>

              </button>

              <div className="pending-card">

                <div className="pending-header">

                  <span className="card-label">
                    PENDIENTES
                  </span>

                  <span className="pending-icon">
                    ↑
                  </span>

                </div>

                <strong>
                  {pendientes}
                </strong>

                <p>
                  Encuestas guardadas en el
                  dispositivo pendientes de
                  sincronización.
                </p>

              </div>

            </section>

            <section className="sync-card">

              <div className="sync-icon">
                ☁
              </div>

              <div className="sync-info">

                <span className="card-label">
                  SINCRONIZACIÓN
                </span>

                <h3>
                  Las encuestas se guardan
                  localmente
                </h3>

                <p>
                  Cuando exista conexión a
                  Internet y el funcionario
                  esté autenticado, las
                  encuestas podrán
                  sincronizarse.
                </p>

              </div>

              <Autenticacion
  onAutenticado={() => {
    abrirPanelFuncionario();
  }}
/>

            </section>

            {encuestas.length > 0 && (

              <section className="local-surveys">

                <div className="local-surveys-header">

                  <div>

                    <span className="card-label">
                      ALMACENAMIENTO LOCAL
                    </span>

                    <h3>
                      Encuestas registradas
                    </h3>

                  </div>

                  <span>
                    {encuestas.length} total
                  </span>

                </div>

                <div className="search-box">

                  <span className="search-icon">
                    🔎
                  </span>

                  <input
                    type="search"
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(
                        event.target.value
                      )
                    }
                    placeholder="Buscar por código, departamento o municipio..."
                  />

                </div>

                <div className="survey-list">

                  {encuestasFiltradas.length >
                  0 ? (

                    encuestasFiltradas.map(
                      (encuesta) => (

                        <div
                          className="survey-item"
                          key={encuesta.id}
                        >

                          <div>

                            <strong>
                              {encuesta.codigo}
                            </strong>

                            <span>
                              {encuesta.departamento ||
                                'Sin departamento'}
                              {' · '}
                              {encuesta.municipio ||
                                'Sin municipio'}
                            </span>

                            <span>
                              Creada el{' '}
                              {formatearFecha(
                                encuesta.fechaCreacion
                              )}
                            </span>

                          </div>

                          <span className="survey-status">

                            {encuesta.estadoSincronizacion ===
                            'sincronizada'
                              ? 'Sincronizada'
                              : 'Pendiente'}

                          </span>

                        </div>

                      )
                    )

                  ) : (

                    <div className="empty-search">

                      <strong>
                        No se encontraron
                        encuestas
                      </strong>

                      <span>
                        Intente con otro código,
                        departamento o municipio.
                      </span>

                    </div>

                  )}

                </div>

              </section>

            )}

          </>
        )}

        {/* ====================================
            PANEL FUNCIONARIO
        ==================================== */}

        {vista === 'funcionario' && (
          <PanelFuncionario
            encuestasPendientes={
              pendientes
            }

            encuestasRegistradas={
              encuestasRegistradas
            }

            online={online}

            sincronizando={
              sincronizando
            }

            errorSincronizacion={
              errorSincronizacion
            }

            onCerrarSesion={
              cerrarSesion
            }

            onSincronizar={
              sincronizar
            }

            onBuscar={
              buscarDesdeFuncionario
            }

            onVerHistoricos={() => {
              setBusqueda('');
              setVista('historicos');
            }}
          />
        )}

        {/* ====================================
            HISTÓRICOS
        ==================================== */}

        {vista === 'historicos' && (
          <HistorialEncuestas
            onVolver={() =>
              setVista('funcionario')
            }
            onVerDetalle={(
              encuestaId
            ) => {
              setEncuestaSeleccionada(
                encuestaId
              );

              setVista('detalle');
            }}
          />
        )}

        {/* ====================================
            DETALLE
        ==================================== */}

        {vista === 'detalle' && (
          <DetalleEncuesta
            encuestaId={
              encuestaSeleccionada
            }
            onVolver={() => {
              setEncuestaSeleccionada(
                null
              );

              setVista('historicos');
            }}
          />
        )}

        {/* ====================================
            ENCUESTA
        ==================================== */}

        {vista === 'encuesta' && (

          <section className="survey-section">

            <div className="survey-header">

              <button
                className="back-button"
                type="button"
                onClick={() =>
                  setVista('inicio')
                }
              >
                ← Volver
              </button>

              <span className="welcome-label">
                NUEVA ENCUESTA
              </span>

              <h2>
                Registro de encuesta
              </h2>

              <p>
                Complete la información de
                la comunidad y responda las
                preguntas de satisfacción.
              </p>

            </div>

            <form
              className="survey-form"
              onSubmit={
                guardarEncuesta
              }
            >

              {/* ===============================
                  UBICACIÓN
              =============================== */}

              <section className="survey-block location-block">

                <div className="survey-block-header">

                  <div>

                    <span className="card-label">
                      UBICACIÓN
                    </span>

                    <h3>
                      Ubicación de la comunidad
                    </h3>

                    <p>
                      Seleccione el departamento
                      y municipio donde se encuentra
                      la comunidad.
                    </p>

                  </div>

                  <span className="section-badge">
                    Requerido
                  </span>

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label htmlFor="departamento">
                      Departamento
                    </label>

                    <select
                      id="departamento"
                      value={
                        formulario.departamentoCodigo
                      }
                      onChange={(event) =>
                        cambiarDepartamento(
                          event.target.value
                        )
                      }
                      disabled={
                        cargandoDepartamentos
                      }
                    >

                      <option value="">
                        {cargandoDepartamentos
                          ? 'Cargando departamentos...'
                          : 'Seleccionar departamento'}
                      </option>

                      {departamentos.map(
                        (departamento) => (
                          <option
                            key={
                              departamento.codigo
                            }
                            value={
                              departamento.codigo
                            }
                          >
                            {departamento.nombre}
                          </option>
                        )
                      )}

                    </select>

                    {errorDepartamentos && (
                      <small className="catalog-error">
                        {errorDepartamentos}
                      </small>
                    )}

                  </div>

                  <div className="form-group">

                    <label htmlFor="municipio">
                      Municipio
                    </label>

                    <select
                      id="municipio"
                      value={
                        formulario.municipioCodigoCompleto
                      }
                      onChange={(event) =>
                        cambiarMunicipio(
                          event.target.value
                        )
                      }
                      disabled={
                        !formulario.departamentoCodigo ||
                        cargandoMunicipios
                      }
                    >

                      <option value="">
                        {cargandoMunicipios
                          ? 'Cargando municipios...'
                          : !formulario.departamentoCodigo
                            ? 'Seleccione primero un departamento'
                            : 'Seleccionar municipio'}
                      </option>

                      {municipios.map(
                        (municipio) => (
                          <option
                            key={
                              municipio.codigoCompleto
                            }
                            value={
                              municipio.codigoCompleto
                            }
                          >
                            {municipio.nombre}
                          </option>
                        )
                      )}

                    </select>

                    {errorMunicipios && (
                      <small className="catalog-error">
                        {errorMunicipios}
                      </small>
                    )}

                  </div>

                </div>

              </section>

              {/* ===============================
                  EVALUACIÓN
              =============================== */}

              <section className="survey-block evaluation-block">

                <div className="survey-block-header">

                  <div>

                    <span className="card-label">
                      EVALUACIÓN DEL SERVICIO
                    </span>

                    <h3>
                      Responda las siguientes
                      preguntas
                    </h3>

                    <p>
                      Complete las preguntas de
                      acuerdo con su experiencia.
                      Las preguntas marcadas con *
                      son obligatorias.
                    </p>

                  </div>

                  <div className="progress-summary">

                    <strong>
                      {progreso}%
                    </strong>

                    <span>
                      completado
                    </span>

                  </div>

                </div>

                <div className="survey-progress">

                  <div
                    className="survey-progress-bar"
                    style={{
                      width: `${progreso}%`,
                    }}
                  ></div>

                </div>

                <div className="progress-help">
                  {preguntasRespondidas} de{' '}
                  {preguntasObligatorias.length}{' '}
                  preguntas obligatorias
                  respondidas
                </div>

                <div className="question-list">

                  {preguntas.map(
                    (pregunta) => (

                      <article
                        className="question-card"
                        key={pregunta.id}
                      >

                        <div className="question-number">
                          {pregunta.orden}
                        </div>

                        <div className="question-content">

                          <Question
                            pregunta={pregunta}
                            valor={
                              respuestas[
                                pregunta.id
                              ]
                            }
                            onChange={(valor) =>
                              actualizarRespuesta(
                                pregunta.id,
                                valor
                              )
                            }
                          />

                        </div>

                      </article>

                    )
                  )}

                </div>

              </section>

              {/* ===============================
                  OBSERVACIONES
              =============================== */}

              <section className="survey-block observations-block">

                <div className="survey-block-header">

                  <div>

                    <span className="card-label">
                      INFORMACIÓN ADICIONAL
                    </span>

                    <h3>
                      Observaciones
                    </h3>

                    <p>
                      Registre cualquier comentario
                      adicional relacionado con la
                      atención recibida.
                    </p>

                  </div>

                  <span className="optional-badge">
                    Opcional
                  </span>

                </div>

                <div className="form-group">

                  <textarea
                    id="observacion"
                    rows="5"
                    value={
                      formulario.observacion
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        'observacion',
                        event.target.value
                      )
                    }
                    placeholder="Escriba aquí sus observaciones..."
                  />

                </div>

              </section>

              {/* ===============================
                  AVISO OFFLINE
              =============================== */}

              <div className="offline-notice">

                <span className="offline-notice-icon">
                  ●
                </span>

                <div>

                  <strong>
                    {guardandoBorrador
                      ? 'Guardando cambios'
                      : 'Guardando local'}
                  </strong>

                  <p>
                    Los cambios se guardan automáticamente en el dispositivo. La encuesta quedará pendiente de sincronización al finalizar.
                  </p>

                </div>

              </div>

              {/* ===============================
                  BOTONES
              =============================== */}

              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setVista('inicio')
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Guardar encuesta
                </button>

              </div>

            </form>

          </section>

        )}

      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="footer">

        <span>
          SATISDATA
        </span>

        <span>
          Gestión de encuestas de satisfacción
        </span>

      </footer>

    </div>
  );
}

export default App;
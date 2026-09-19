import { useEffect, useMemo, useState } from 'react';
import './App.css';

import { db } from './db/database';

import PanelFuncionario from './components/PanelFuncionario';
import HistorialEncuestas from './components/HistorialEncuestas';
import DetalleEncuesta from './components/DetalleEncuesta';
import Question from './components/Question';

import { preguntasDemo } from './data/preguntasDemo';

import {
  obtenerDepartamentos,
  obtenerMunicipios,
} from './services/divipola';

function App() {
  // ==========================================
  // ESTADOS PRINCIPALES
  // ==========================================

  const [encuestas, setEncuestas] = useState([]);
  const [vista, setVista] = useState('inicio');
  const [encuestaSeleccionada, setEncuestaSeleccionada] =
    useState(null);

  const [busqueda, setBusqueda] = useState('');

  const [conectado, setConectado] = useState(
    navigator.onLine
  );

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

  const [respuestas, setRespuestas] = useState({});

  const [borradorId, setBorradorId] = useState(null);
const [guardandoBorrador, setGuardandoBorrador] = useState(false);
const [borradorEncontrado, setBorradorEncontrado] =
  useState(null);

const [mostrarBorrador, setMostrarBorrador] =
  useState(false);

  // ==========================================
  // ÚNICA FUENTE DE PREGUNTAS
  // ==========================================

  const preguntas = useMemo(
    () =>
      preguntasDemo
        .filter((pregunta) => pregunta.activa)
        .sort((a, b) => a.orden - b.orden),
    []
  );

  // ==========================================
  // PROGRESO DE LA ENCUESTA
  // ==========================================

  const preguntasObligatorias = preguntas.filter(
    (pregunta) => pregunta.obligatoria
  );

  const preguntasRespondidas = preguntasObligatorias.filter(
    (pregunta) => {
      const valor = respuestas[pregunta.id];

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
  // DETECTAR CONEXIÓN
  // ==========================================

  useEffect(() => {
    cargarEncuestas();
    cargarDepartamentos();

    const manejarConexion = () => {
      setConectado(navigator.onLine);
    };

    window.addEventListener(
      'online',
      manejarConexion
    );

    window.addEventListener(
      'offline',
      manejarConexion
    );

    return () => {
      window.removeEventListener(
        'online',
        manejarConexion
      );

      window.removeEventListener(
        'offline',
        manejarConexion
      );
    };
  }, []);
  // ==========================================
// AUTOGUARDADO DEL BORRADOR
// ==========================================

useEffect(() => {
  if (
    vista !== 'encuesta' ||
    !borradorId
  ) {
    return;
  }

  const temporizador = setTimeout(() => {
    guardarBorrador();
  }, 400);

  return () => {
    clearTimeout(temporizador);
  };
}, [
  formulario,
  respuestas,
  borradorId,
  vista,
]);


  // ==========================================
  // CARGAR ENCUESTAS
  // ==========================================

  const cargarEncuestas = async () => {
    try {
      const registros = await db.encuestas
        .orderBy('id')
        .reverse()
        .toArray();

      setEncuestas(registros);

      console.log(
        'Encuestas cargadas:',
        registros
      );
    } catch (error) {
      console.error(
        'Error cargando encuestas:',
        error
      );
    }
  };

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
        municipioSeleccionado?.nombre ||
        '',

      municipioCodigo:
        municipioSeleccionado?.codigo ||
        '',

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
    const borradoresActivos =
      await db.borradores
        .where('estado')
        .equals('activo')
        .toArray();

    if (borradoresActivos.length > 0) {
  const borrador = borradoresActivos
    .sort(
      (a, b) =>
        new Date(b.fechaActualizacion) -
        new Date(a.fechaActualizacion)
    )[0];

  setBorradorEncontrado(borrador);
  setMostrarBorrador(true);

  return;
}

    const nuevoBorrador = {
      fechaCreacion:
        new Date().toISOString(),

      fechaActualizacion:
        new Date().toISOString(),

      funcionarioId: null,

      estado: 'activo',

      formulario: {
        departamento: '',
        municipio: '',
        observacion: '',
        departamentoCodigo: '',
        municipioCodigo: '',
        municipioCodigoCompleto: '',
      },

      respuestas: {},
    };

    const id =
      await db.borradores.add(
        nuevoBorrador
      );

    setBorradorId(id);

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
    setBorradorId(
      borradorEncontrado.id
    );

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
        datosFormulario.municipioCodigoCompleto || '',
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

    setMostrarBorrador(false);
    setBorradorEncontrado(null);
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
    await db.borradores.delete(
      borradorEncontrado.id
    );

    setBorradorEncontrado(null);
    setMostrarBorrador(false);

    iniciarEncuesta();
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
// BORRADOR AUTOMÁTICO
// ==========================================

const guardarBorrador = async () => {
  if (!borradorId) {
    return;
  }

  try {
    setGuardandoBorrador(true);

    await db.borradores.update(borradorId, {
      fechaActualizacion: new Date().toISOString(),

      formulario: {
        ...formulario,
      },

      respuestas: {
        ...respuestas,
      },
    });
  } catch (error) {
    console.error(
      'Error guardando borrador:',
      error
    );
  } finally {
    setGuardandoBorrador(false);
  }
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

      const encuestaId =
        await db.transaction(
          'rw',
          db.encuestas,
          db.respuestas,
          db.borradores,
          async () => {
            const id =
              await db.encuestas.add(
                nuevaEncuesta
              );

            for (
              const pregunta of preguntas
            ) {
              const valor =
                respuestas[pregunta.id];

              const tieneRespuesta =
                valor !== undefined &&
                valor !== null &&
                valor !== '' &&
                !(
                  Array.isArray(valor) &&
                  valor.length === 0
                );

              if (tieneRespuesta) {
                await db.respuestas.add({
                  encuestaId: id,
                  preguntaId:
                    pregunta.id,
                  respuesta: valor,
                });
              }
            }
            if (borradorId){
              await db.borradores.delete(
                borradorId
              );
            }
            

            return id;
            
          }
        );

      console.log(
        'Encuesta guardada con ID:',
        encuestaId
      );

      console.log(
        'Respuestas guardadas:',
        respuestas
      );

      await cargarEncuestas();

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
  // ENCUESTAS PENDIENTES
  // ==========================================

  const encuestasPendientes =
    encuestas.filter(
      (encuesta) =>
        encuesta.estadoSincronizacion ===
        'pendiente'
    ).length;

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

  const sincronizarEncuestas = () => {
    if (!conectado) {
      alert(
        'No hay conexión a Internet. Las encuestas permanecerán almacenadas localmente.'
      );

      return;
    }

    alert(
      'La sincronización con el servidor se implementará en la siguiente fase.'
    );
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
              conectado
                ? 'is-online'
                : 'is-offline'
            }`}
          >
            <span
              className={`status-dot ${
                conectado
                  ? 'online'
                  : 'offline'
              }`}
            ></span>

            <span>
              {conectado
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
              <span>Departamento</span>

              <strong>
                {borradorEncontrado.formulario
                  ?.departamento ||
                  'Sin seleccionar'}
              </strong>
            </div>

            <div>
              <span>Municipio</span>

              <strong>
                {borradorEncontrado.formulario
                  ?.municipio ||
                  'Sin seleccionar'}
              </strong>
            </div>

            <div>
              <span>Última actualización</span>

              <strong>
                {new Date(
                  borradorEncontrado.fechaActualizacion
                ).toLocaleString('es-CO', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
          </div>

          <div className="draft-progress">
            <div className="draft-progress-header">
              <span>Progreso de la encuesta</span>

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
                            Array.isArray(valor) &&
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
                              Array.isArray(valor) &&
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
            onClick={descartarBorrador}
          >
            Descartar
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={continuarBorrador}
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
                onClick={iniciarEncuesta}
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
                  {encuestasPendientes}
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

              <button
                className="login-button"
                type="button"
                onClick={
                  abrirPanelFuncionario
                }
              >
                Ingresar con Microsoft
              </button>

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
              encuestasPendientes
            }
            encuestasRegistradas={
              encuestasRegistradas
            }
            onCerrarSesion={
              cerrarSesion
            }
            onSincronizar={
              sincronizarEncuestas
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
              onSubmit={guardarEncuesta}
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
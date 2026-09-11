import { useEffect, useState } from 'react';
import './App.css';
import { db } from './db/database';
import PanelFuncionario from './components/PanelFuncionario';
import HistorialEncuestas from './components/HistorialEncuestas';
import DetalleEncuesta from './components/DetalleEncuesta';

function App() {
  // ==========================================
  // ESTADOS PRINCIPALES
  // ==========================================

  const [encuestas, setEncuestas] = useState([]);
  const [vista, setVista] = useState('inicio');
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const [conectado, setConectado] = useState(
    navigator.onLine
  );

  // ==========================================
  // FORMULARIO DE LA ENCUESTA
  // ==========================================

  const [formulario, setFormulario] = useState({
    departamento: '',
    municipio: '',
    observacion: '',
  });

  // ==========================================
  // RESPUESTAS DE LAS PREGUNTAS
  // ==========================================

  const [respuestas, setRespuestas] = useState({});

  // ==========================================
  // PREGUNTAS PROVISIONALES
  // ==========================================

  const preguntas = [
    {
      id: 'P01',
      texto:
        '¿Qué tan satisfecho se encuentra con la atención recibida por el funcionario?',
    },
    {
      id: 'P02',
      texto:
        '¿La información proporcionada durante la atención fue clara y comprensible?',
    },
    {
      id: 'P03',
      texto:
        '¿Considera que su solicitud o necesidad fue atendida adecuadamente?',
    },
    {
      id: 'P04',
      texto:
        '¿Cómo califica el tiempo de respuesta recibido durante la atención?',
    },
    {
      id: 'P05',
      texto:
        'En términos generales, ¿qué tan satisfecho se encuentra con el servicio recibido?',
    },
  ];

  // ==========================================
  // DETECTAR CONEXIÓN
  // ==========================================

  useEffect(() => {
    cargarEncuestas();

    const manejarConexion = () => {
      setConectado(navigator.onLine);
    };

    window.addEventListener('online', manejarConexion);
    window.addEventListener('offline', manejarConexion);

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
  // NUEVA ENCUESTA
  // ==========================================

  const iniciarEncuesta = () => {
    setFormulario({
      departamento: '',
      municipio: '',
      observacion: '',
    });

    setRespuestas({});

    setVista('encuesta');
  };

  // ==========================================
  // CAMBIAR CAMPOS
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
  // CAMBIAR RESPUESTA
  // ==========================================

  const actualizarRespuesta = (
    preguntaId,
    valor
  ) => {
    setRespuestas((datos) => ({
      ...datos,
      [preguntaId]: Number(valor),
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

    if (!formulario.municipio.trim()) {
      alert(
        'Ingrese el municipio.'
      );

      return false;
    }

    for (const pregunta of preguntas) {
      if (!respuestas[pregunta.id]) {
        alert(
          'Por favor responda todas las preguntas.'
        );

        return false;
      }
    }

    return true;
  };

  // ==========================================
  // GUARDAR ENCUESTA
  // ==========================================

  const guardarEncuesta = async (event) => {
    event.preventDefault();

    if (!encuestaCompleta()) {
      return;
    }

    try {
      // ----------------------------------------
      // CREAR ENCUESTA
      // ----------------------------------------

      const nuevaEncuesta = {
        codigo: `ENC-${Date.now()}`,

        fechaCreacion:
          new Date().toISOString(),

        departamento:
          formulario.departamento,

        municipio:
          formulario.municipio,

        funcionarioId: null,

        estadoSincronizacion:
          'pendiente',

        observacion:
          formulario.observacion,
      };

      // ----------------------------------------
      // GUARDAR ENCUESTA EN DEXIE
      // ----------------------------------------

      const encuestaId =
        await db.encuestas.add(
          nuevaEncuesta
        );

      console.log(
        'Encuesta guardada con ID:',
        encuestaId
      );

      // ----------------------------------------
      // GUARDAR RESPUESTAS
      // ----------------------------------------

      for (const pregunta of preguntas) {
        await db.respuestas.add({
          encuestaId: encuestaId,

          preguntaId: pregunta.id,

          respuesta:
            respuestas[pregunta.id],
        });
      }

      console.log(
        'Respuestas guardadas:',
        respuestas
      );

      // ----------------------------------------
      // ACTUALIZAR LISTADO
      // ----------------------------------------

      await cargarEncuestas();

      // ----------------------------------------
      // LIMPIAR FORMULARIO
      // ----------------------------------------

      setFormulario({
        departamento: '',
        municipio: '',
        observacion: '',
      });

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
  // PANEL DEL FUNCIONARIO
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

  const buscarDesdeFuncionario = (texto) => {
    setBusqueda(texto || '');
    setVista('inicio');
  };

  const encuestasRegistradas = encuestas.length;

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
  // FORMATO DE FECHA
  // ==========================================

  const formatearFecha = (fecha) => {
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

          <div className="connection-status">

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

            {/* DASHBOARD */}

            <section className="dashboard">

              <button
                className="new-survey-card"
                onClick={iniciarEncuesta}
                type="button"
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

              {/* PENDIENTES */}

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

            {/* SINCRONIZACIÓN */}

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
  onClick={abrirPanelFuncionario}
>
  Ingresar con Microsoft
</button>

            </section>

            {/* =================================
                ENCUESTAS REGISTRADAS
            ================================= */}

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

                {/* BUSCADOR */}

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

                {/* LISTADO */}

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
            PANEL DEL FUNCIONARIO
        ==================================== */}

        {vista === 'funcionario' && (
          <PanelFuncionario
            encuestasPendientes={encuestasPendientes}
            encuestasRegistradas={encuestasRegistradas}
            onCerrarSesion={cerrarSesion}
            onSincronizar={sincronizarEncuestas}
            onBuscar={buscarDesdeFuncionario}
            onVerHistoricos={() =>{ setBusqueda(''); setVista('historicos')}}
          />
        )}

        {/* ====================================
    HISTÓRICOS
==================================== */}

{vista === 'historicos' && (
  <HistorialEncuestas
    onVolver={() => setVista('funcionario')}
    onVerDetalle={(encuestaId) => {
      setEncuestaSeleccionada(encuestaId);
      setVista('detalle');
    }}
  />
)}

{/* ====================================
    DETALLE DE ENCUESTA
==================================== */}

{vista === 'detalle' && (
  <DetalleEncuesta
    encuestaId={encuestaSeleccionada}
    onVolver={() => {
      setEncuestaSeleccionada(null);
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
                Complete la información
                solicitada. Los datos se
                almacenarán localmente.
              </p>

            </div>
          
            {/* FORMULARIO */}

            <form
              className="survey-form"
              onSubmit={guardarEncuesta}
            >

              {/* =================================
                  UBICACIÓN
              ================================= */}

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="departamento">
                    Departamento
                  </label>

                  <select
                    id="departamento"
                    value={
                      formulario.departamento
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        'departamento',
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Seleccionar departamento
                    </option>

                    <option>
                      Bogotá D.C.
                    </option>

                    <option>
                      Cundinamarca
                    </option>

                    <option>
                      Antioquia
                    </option>

                    <option>
                      Boyacá
                    </option>

                  </select>

                </div>

                {/* MUNICIPIO */}

                <div className="form-group">

                  <label htmlFor="municipio">
                    Municipio
                  </label>

                  <input
                    id="municipio"
                    type="text"
                    value={
                      formulario.municipio
                    }
                    onChange={(event) =>
                      actualizarCampo(
                        'municipio',
                        event.target.value
                      )
                    }
                    placeholder="Municipio"
                  />

                </div>

              </div>

              {/* =================================
                  PREGUNTAS
              ================================= */}

              <div className="survey-questions">

                <span className="card-label">
                  EVALUACIÓN DEL SERVICIO
                </span>

                <h3>
                  Responda las siguientes preguntas
                </h3>

                <p className="question-help">
                  Seleccione una opción de 1 a 5,
                  donde 1 corresponde a la menor
                  valoración y 5 a la mayor.
                </p>

                {preguntas.map(
                  (pregunta, indice) => (

                    <div
                      className="question-card"
                      key={pregunta.id}
                    >

                      <div className="question-number">
                        {indice + 1}
                      </div>

                      <div className="question-content">

                        <label>
                          {pregunta.texto}
                        </label>

                        <div className="rating-options">

                          {[1, 2, 3, 4, 5].map(
                            (valor) => (

                              <label
                                className="rating-option"
                                key={valor}
                              >

                                <input
                                  type="radio"
                                  name={
                                    pregunta.id
                                  }
                                  value={valor}
                                  checked={
                                    respuestas[
                                      pregunta.id
                                    ] === valor
                                  }
                                  onChange={(event) =>
                                    actualizarRespuesta(
                                      pregunta.id,
                                      event.target.value
                                    )
                                  }
                                />

                                <span>
                                  {valor}
                                </span>

                              </label>

                            )
                          )}

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

              {/* =================================
                  OBSERVACIONES
              ================================= */}

              <div className="form-group">

                <label htmlFor="observacion">
                  Observaciones
                </label>

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
                  placeholder="Observaciones adicionales..."
                />

              </div>

              {/* =================================
                  AVISO OFFLINE
              ================================= */}

              <div className="offline-notice">

                <span>
                  ●
                </span>

                <div>

                  <strong>
                    Guardado local
                  </strong>

                  <p>
                    La encuesta y sus respuestas
                    se almacenarán en el dispositivo
                    y quedarán pendientes de
                    sincronización.
                  </p>

                </div>

              </div>

              {/* =================================
                  BOTONES
              ================================= */}

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
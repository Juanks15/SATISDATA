import { useEffect, useState } from 'react';
import { db } from '../db/database';

function HistorialEncuestas({
  onVolver,
  onVerDetalle,
}) {
  const [encuestas, setEncuestas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEncuestas();
  }, []);

  const cargarEncuestas = async () => {
    try {
      setCargando(true);

      const registros = await db.encuestas
        .orderBy('id')
        .reverse()
        .toArray();

      setEncuestas(registros);
    } catch (error) {
      console.error(
        'Error cargando históricos:',
        error
      );
    } finally {
      setCargando(false);
    }
  };

  const encuestasFiltradas = encuestas.filter(
    (encuesta) => {
      const termino = busqueda
        .toLowerCase()
        .trim();

      if (!termino) {
        return true;
      }

      return (
        String(encuesta.codigo || '')
          .toLowerCase()
          .includes(termino) ||
        String(encuesta.departamento || '')
          .toLowerCase()
          .includes(termino) ||
        String(encuesta.municipio || '')
          .toLowerCase()
          .includes(termino)
      );
    }
  );

  const obtenerEstado = (estado) => {
    if (estado === 'sincronizada') {
      return {
        texto: 'Sincronizada',
        clase: 'history-status-synced',
      };
    }

    return {
      texto: 'Pendiente',
      clase: 'history-status-pending',
    };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return 'Fecha no disponible';
    }

    return new Date(fecha).toLocaleString(
      'es-CO',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  return (
    <section className="history-section">

      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="history-page-header">

        <button
          type="button"
          className="history-back-button"
          onClick={onVolver}
        >
          <span>←</span>
          Volver al panel
        </button>

        <div className="history-title-row">

          <div className="history-title-icon">
            ≡
          </div>

          <div>
            <span className="history-kicker">
              CONSULTA
            </span>

            <h2>
              Históricos de encuestas
            </h2>

            <p>
              Consulte y revise las encuestas
              almacenadas actualmente en el dispositivo.
            </p>
          </div>

        </div>

      </div>

      {/* ==================================================
          BÚSQUEDA Y RESUMEN
      ================================================== */}

      <section className="history-toolbar">

        <div className="history-search-wrapper">

          <span className="history-search-icon">
            ⌕
          </span>

          <input
            type="search"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
            placeholder="Buscar por código, departamento o municipio..."
            aria-label="Buscar encuesta"
          />

          {busqueda && (
            <button
              type="button"
              className="history-clear-search"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}

        </div>

        <div className="history-count">

          <strong>
            {encuestasFiltradas.length}
          </strong>

          <span>
            {encuestasFiltradas.length === 1
              ? 'registro encontrado'
              : 'registros encontrados'}
          </span>

        </div>

      </section>

      {/* ==================================================
          LISTADO
      ================================================== */}

      <section className="history-card">

        <div className="history-card-header">

          <div>
            <span className="history-card-kicker">
              ALMACENAMIENTO LOCAL
            </span>

            <h3>
              Registros almacenados
            </h3>
          </div>

          <span className="history-total">
            {encuestas.length}{' '}
            {encuestas.length === 1
              ? 'registro total'
              : 'registros totales'}
          </span>

        </div>

        {cargando ? (

          <div className="history-state">

            <div className="history-loader"></div>

            <strong>
              Cargando históricos
            </strong>

            <span>
              Consultando el almacenamiento local...
            </span>

          </div>

        ) : encuestasFiltradas.length === 0 ? (

          <div className="history-state history-state-empty">

            <div className="history-empty-icon">
              {busqueda ? '⌕' : '○'}
            </div>

            <strong>
              {busqueda
                ? 'No se encontraron coincidencias'
                : 'No hay encuestas almacenadas'}
            </strong>

            <span>
              {busqueda
                ? 'Pruebe con otro código, departamento o municipio.'
                : 'Cuando registre una encuesta aparecerá aquí.'}
            </span>

            {busqueda && (
              <button
                type="button"
                className="history-reset-button"
                onClick={() => setBusqueda('')}
              >
                Limpiar búsqueda
              </button>
            )}

          </div>

        ) : (

          <div className="history-list">

            {encuestasFiltradas.map(
              (encuesta, index) => {
                const estado = obtenerEstado(
                  encuesta.estadoSincronizacion
                );

                return (
                  <article
                    className="history-item"
                    key={encuesta.id}
                  >

                    <div className="history-item-index">
                      {String(index + 1).padStart(
                        2,
                        '0'
                      )}
                    </div>

                    <div className="history-item-main">

                      <div className="history-item-title-row">

                        <strong>
                          {encuesta.codigo ||
                            `Encuesta #${encuesta.id}`}
                        </strong>

                        <span
                          className={`history-status ${estado.clase}`}
                        >
                          <span className="history-status-dot"></span>
                          {estado.texto}
                        </span>

                      </div>

                      <div className="history-location">

                        <span>
                          Departamento
                        </span>

                        <strong>
                          {encuesta.departamento ||
                            'No registrado'}
                        </strong>

                        <span className="history-location-separator">
                          /
                        </span>

                        <span>
                          Municipio
                        </span>

                        <strong>
                          {encuesta.municipio ||
                            'No registrado'}
                        </strong>

                      </div>

                      <span className="history-date">
                        {formatearFecha(
                          encuesta.fechaCreacion
                        )}
                      </span>

                    </div>

                    <div className="history-item-action">

                      <button
                        type="button"
                        className="history-view-button"
                        onClick={() =>
                          onVerDetalle(
                            encuesta.id
                          )
                        }
                      >
                        Ver detalle
                        <span>→</span>
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </section>

    </section>
  );
}

export default HistorialEncuestas;
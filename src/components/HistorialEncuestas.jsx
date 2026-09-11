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

  const encuestasFiltradas =
    encuestas.filter((encuesta) => {

      const termino =
        busqueda
          .toLowerCase()
          .trim();

      if (!termino) {
        return true;
      }

      return (
        String(
          encuesta.codigo || ''
        )
          .toLowerCase()
          .includes(termino) ||

        String(
          encuesta.departamento || ''
        )
          .toLowerCase()
          .includes(termino) ||

        String(
          encuesta.municipio || ''
        )
          .toLowerCase()
          .includes(termino)
      );
    });

  const obtenerEstado = (
    estado
  ) => {

    if (
      estado === 'sincronizada'
    ) {
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

  return (
    <section className="history-section">

      {/* ENCABEZADO */}

      <div className="history-header">

        <button
          type="button"
          className="back-button"
          onClick={onVolver}
        >
          ← Volver al panel
        </button>

        <span className="welcome-label">
          CONSULTA
        </span>

        <h2>
          Históricos de encuestas
        </h2>

        <p>
          Consulte las encuestas almacenadas
          actualmente en este dispositivo.
        </p>

      </div>

      {/* BÚSQUEDA */}

      <div className="history-search">

        <input
          type="search"
          value={busqueda}
          onChange={(event) =>
            setBusqueda(
              event.target.value
            )
          }
          placeholder="Buscar por código, municipio o departamento..."
        />

      </div>

      {/* CONTENIDO */}

      <div className="history-card">

        <div className="history-card-header">

          <div>

            <span className="card-label">
              ENCUESTAS
            </span>

            <h3>
              Registros almacenados
            </h3>

          </div>

          <span>
            {encuestasFiltradas.length}{' '}
            registro(s)
          </span>

        </div>

        {cargando ? (

          <div className="history-empty">
            Cargando encuestas...
          </div>

        ) : encuestasFiltradas.length === 0 ? (

          <div className="history-empty">

            <strong>
              No se encontraron encuestas
            </strong>

            <p>
              {busqueda
                ? 'Intente realizar la búsqueda con otro término.'
                : 'Todavía no existen encuestas almacenadas en el dispositivo.'}
            </p>

          </div>

        ) : (

          <div className="history-list">

            {encuestasFiltradas.map(
              (encuesta) => {

                const estado =
                  obtenerEstado(
                    encuesta.estadoSincronizacion
                  );

                return (
                  <div
                    className="history-item"
                    key={encuesta.id}
                  >

                    <div className="history-item-main">

                      <strong>
                        {encuesta.codigo ||
                          `Encuesta #${encuesta.id}`}
                      </strong>

                      <span>
                        {encuesta.departamento ||
                          'Sin departamento'}
                        {' · '}
                        {encuesta.municipio ||
                          'Sin municipio'}
                      </span>

                      <span>
                        {encuesta.fechaCreacion
                          ? new Date(
                              encuesta.fechaCreacion
                            ).toLocaleString(
                              'es-CO'
                            )
                          : 'Fecha no disponible'}
                      </span>

                    </div>

                    <div className="history-item-actions">

                      <span
                        className={`history-status ${estado.clase}`}
                      >
                        {estado.texto}
                      </span>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          onVerDetalle(
                            encuesta.id
                          )
                        }
                      >
                        Ver encuesta →
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

    </section>
  );
}

export default HistorialEncuestas;
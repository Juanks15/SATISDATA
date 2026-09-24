import {
  useEffect,
  useState,
} from 'react';

import { preguntasDemo } from '../data/preguntasDemo';
import { useEncuestas } from '../hooks/useEncuestas';

function DetalleEncuesta({
  encuestaId,
  onVolver,
}) {
  const {
    obtenerEncuesta,
  } = useEncuestas();

  const [encuesta, setEncuesta] =
    useState(null);

  const [respuestas, setRespuestas] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    let activo = true;

    const cargarDetalle = async () => {
      try {
        setCargando(true);

        const encuestaEncontrada =
          await obtenerEncuesta(encuestaId);

        if (!activo) {
          return;
        }

        if (!encuestaEncontrada) {
          setEncuesta(null);
          setRespuestas([]);
          return;
        }

        setEncuesta(encuestaEncontrada);

        setRespuestas(
          encuestaEncontrada.respuestas || []
        );
      } catch (error) {
        console.error(
          'Error cargando detalle de encuesta:',
          error
        );

        if (activo) {
          setEncuesta(null);
          setRespuestas([]);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarDetalle();

    return () => {
      activo = false;
    };
  }, [encuestaId, obtenerEncuesta]);

  const obtenerRespuesta = (preguntaId) => {
    const respuesta = respuestas.find(
      (item) =>
        item.preguntaId === preguntaId
    );

    return respuesta?.respuesta;
  };

  const mostrarRespuesta = (valor) => {
    if (
      valor === undefined ||
      valor === null ||
      valor === ''
    ) {
      return 'Sin respuesta';
    }

    if (Array.isArray(valor)) {
      return valor.length > 0
        ? valor.join(', ')
        : 'Sin respuesta';
    }

    return String(valor);
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

  const estadoSincronizacion =
    encuesta?.estadoSincronizacion ===
    'sincronizada';

  if (cargando) {
    return (
      <section className="detail-section">

        <button
          type="button"
          className="detail-back-button"
          onClick={onVolver}
        >
          ← Volver a históricos
        </button>

        <div className="detail-state-card">

          <div className="detail-loader"></div>

          <strong>
            Cargando encuesta
          </strong>

          <span>
            Consultando la información almacenada...
          </span>

        </div>

      </section>
    );
  }

  if (!encuesta) {
    return (
      <section className="detail-section">

        <button
          type="button"
          className="detail-back-button"
          onClick={onVolver}
        >
          ← Volver a históricos
        </button>

        <div className="detail-state-card detail-state-error">

          <div className="detail-state-icon">
            !
          </div>

          <strong>
            Encuesta no encontrada
          </strong>

          <span>
            No fue posible encontrar el registro
            solicitado en el almacenamiento local.
          </span>

        </div>

      </section>
    );
  }

  const preguntas = preguntasDemo
    .filter(
      (pregunta) => pregunta.activa
    )
    .sort(
      (a, b) => a.orden - b.orden
    );

  return (
    <section className="detail-section">

      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="detail-page-header">

        <button
          type="button"
          className="detail-back-button"
          onClick={onVolver}
        >
          <span>←</span>
          Volver a históricos
        </button>

        <div className="detail-title-row">

          <div className="detail-title-icon">
            #
          </div>

          <div>

            <span className="detail-kicker">
              DETALLE DE REGISTRO
            </span>

            <h2>
              Detalle de encuesta
            </h2>

            <p>
              Consulte la información completa
              de la encuesta almacenada.
            </p>

          </div>

        </div>

      </div>

      {/* ==================================================
          RESUMEN PRINCIPAL
      ================================================== */}

      <section className="detail-hero">

        <div className="detail-hero-main">

          <span className="detail-card-kicker">
            CÓDIGO DE ENCUESTA
          </span>

          <h3>
            {encuesta.codigo ||
              `Encuesta #${encuesta.id}`}
          </h3>

          <span className="detail-hero-date">
            Registrada el{' '}
            {formatearFecha(
              encuesta.fechaCreacion
            )}
          </span>

        </div>

        <div
          className={
            estadoSincronizacion
              ? 'detail-status detail-status-synced'
              : 'detail-status detail-status-pending'
          }
        >

          <span className="detail-status-dot"></span>

          <div>
            <small>
              ESTADO
            </small>

            <strong>
              {estadoSincronizacion
                ? 'Sincronizada'
                : 'Pendiente'}
            </strong>
          </div>

        </div>

      </section>

      {/* ==================================================
          UBICACIÓN
      ================================================== */}

      <section className="detail-card">

        <div className="detail-card-header">

          <div>
            <span className="detail-card-kicker">
              UBICACIÓN
            </span>

            <h3>
              Ubicación de la comunidad
            </h3>
          </div>

        </div>

        <div className="detail-info-grid">

          <div className="detail-info-item">
            <span>
              Departamento
            </span>

            <strong>
              {encuesta.departamento ||
                'No registrado'}
            </strong>
          </div>

          <div className="detail-info-item">
            <span>
              Municipio
            </span>

            <strong>
              {encuesta.municipio ||
                'No registrado'}
            </strong>
          </div>

          <div className="detail-info-item">
            <span>
              Código municipal
            </span>

            <strong>
              {encuesta.municipioCodigoCompleto ||
                encuesta.municipioCodigo ||
                'No registrado'}
            </strong>
          </div>

        </div>

      </section>

      {/* ==================================================
          RESPUESTAS
      ================================================== */}

      <section className="detail-card">

        <div className="detail-card-header">

          <div>
            <span className="detail-card-kicker">
              EVALUACIÓN
            </span>

            <h3>
              Respuestas registradas
            </h3>
          </div>

          <span className="detail-answer-count">
            {respuestas.length}{' '}
            {respuestas.length === 1
              ? 'respuesta'
              : 'respuestas'}
          </span>

        </div>

        <div className="detail-answer-list">

          {preguntas.map(
            (pregunta, index) => {

              const valor =
                obtenerRespuesta(
                  pregunta.id
                );

              const respuestaVisible =
                mostrarRespuesta(
                  valor
                );

              return (
                <article
                  className="detail-answer-item"
                  key={pregunta.id}
                >

                  <div className="detail-answer-number">
                    {String(index + 1).padStart(
                      2,
                      '0'
                    )}
                  </div>

                  <div className="detail-answer-body">

                    <span className="detail-answer-label">
                      {pregunta.codigo ||
                        `Pregunta ${index + 1}`}
                    </span>

                    <h4>
                      {pregunta.texto}

                      {pregunta.obligatoria && (
                        <span className="detail-required">
                          *
                        </span>
                      )}
                    </h4>

                    <div
                      className={
                        respuestaVisible ===
                        'Sin respuesta'
                          ? 'detail-answer-value detail-answer-empty'
                          : 'detail-answer-value'
                      }
                    >
                      {respuestaVisible}
                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

      </section>

      {/* ==================================================
          OBSERVACIONES
      ================================================== */}

      <section className="detail-card">

        <div className="detail-card-header">

          <div>
            <span className="detail-card-kicker">
              INFORMACIÓN ADICIONAL
            </span>

            <h3>
              Observaciones
            </h3>
          </div>

          <span className="detail-optional-badge">
            Opcional
          </span>

        </div>

        <div className="detail-observation">

          {encuesta.observacion?.trim() ? (
            <p>
              {encuesta.observacion}
            </p>
          ) : (
            <span>
              No se registraron observaciones
              adicionales.
            </span>
          )}

        </div>

      </section>

      {/* ==================================================
          PIE
      ================================================== */}

      <div className="detail-footer">

        <span>
          ID local de registro
        </span>

        <strong>
          #{encuesta.id}
        </strong>

      </div>

    </section>
  );
}

export default DetalleEncuesta;
import { useEffect, useState } from 'react';
import { db } from '../db/database';
import { preguntasDemo } from '../data/preguntasDemo';

function DetalleEncuesta({
  encuestaId,
  onVolver,
}) {
  const [encuesta, setEncuesta] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDetalle();
  }, [encuestaId]);

  const cargarDetalle = async () => {
    try {
      setCargando(true);

      const encuestaEncontrada =
        await db.encuestas.get(encuestaId);

      if (!encuestaEncontrada) {
        setEncuesta(null);
        return;
      }

      const respuestasEncontradas =
        await db.respuestas
          .where('encuestaId')
          .equals(encuestaId)
          .toArray();

      setEncuesta(encuestaEncontrada);
      setRespuestas(respuestasEncontradas);

    } catch (error) {
      console.error(
        'Error cargando detalle de encuesta:',
        error
      );
    } finally {
      setCargando(false);
    }
  };

  const obtenerPregunta = (preguntaId) => {
    return preguntasDemo.find(
      (pregunta) =>
        pregunta.id === preguntaId
    );
  };

  const obtenerRespuesta = (preguntaId) => {
    const respuesta =
      respuestas.find(
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
      return valor.join(', ');
    }

    return String(valor);
  };

  if (cargando) {
    return (
      <section className="history-section">

        <button
          type="button"
          className="back-button"
          onClick={onVolver}
        >
          ← Volver a históricos
        </button>

        <div className="history-card">
          <div className="history-empty">
            Cargando encuesta...
          </div>
        </div>

      </section>
    );
  }

  if (!encuesta) {
    return (
      <section className="history-section">

        <button
          type="button"
          className="back-button"
          onClick={onVolver}
        >
          ← Volver a históricos
        </button>

        <div className="history-card">
          <div className="history-empty">

            <strong>
              Encuesta no encontrada
            </strong>

            <p>
              No fue posible encontrar el
              registro solicitado en el
              almacenamiento local.
            </p>

          </div>
        </div>

      </section>
    );
  }

  const preguntas = preguntasDemo
    .filter(
      (pregunta) =>
        pregunta.activa
    )
    .sort(
      (a, b) =>
        a.orden - b.orden
    );

  return (
    <section className="history-section">

      {/* ENCABEZADO */}

      <div className="history-header">

        <button
          type="button"
          className="back-button"
          onClick={onVolver}
        >
          ← Volver a históricos
        </button>

        <span className="welcome-label">
          DETALLE
        </span>

        <h2>
          Detalle de encuesta
        </h2>

        <p>
          Consulte la información y las
          respuestas registradas.
        </p>

      </div>

      {/* INFORMACIÓN GENERAL */}

      <div className="detail-summary">

        <div className="detail-summary-main">

          <span className="card-label">
            CÓDIGO DE ENCUESTA
          </span>

          <h3>
            {encuesta.codigo ||
              `Encuesta #${encuesta.id}`}
          </h3>

        </div>

        <div className="detail-status">

          <span className="card-label">
            ESTADO
          </span>

          <span
            className={`history-status ${
              encuesta.estadoSincronizacion ===
              'sincronizada'
                ? 'history-status-synced'
                : 'history-status-pending'
            }`}
          >
            {encuesta.estadoSincronizacion ===
            'sincronizada'
              ? 'Sincronizada'
              : 'Pendiente'}
          </span>

        </div>

      </div>

      {/* DATOS */}

      <div className="detail-info-card">

        <div className="detail-info-item">

          <span className="card-label">
            DEPARTAMENTO
          </span>

          <strong>
            {encuesta.departamento ||
              'No registrado'}
          </strong>

        </div>

        <div className="detail-info-item">

          <span className="card-label">
            MUNICIPIO
          </span>

          <strong>
            {encuesta.municipio ||
              'No registrado'}
          </strong>

        </div>

        <div className="detail-info-item">

          <span className="card-label">
            FECHA
          </span>

          <strong>
            {encuesta.fechaCreacion
              ? new Date(
                  encuesta.fechaCreacion
                ).toLocaleString('es-CO')
              : 'No registrada'}
          </strong>

        </div>

      </div>

      {/* RESPUESTAS */}

      <div className="detail-answers-card">

        <div className="detail-card-header">

          <div>

            <span className="card-label">
              RESPUESTAS
            </span>

            <h3>
              Respuestas de la encuesta
            </h3>

          </div>

        </div>

        <div className="detail-answers-list">

          {preguntas.map(
            (pregunta, index) => {

              const valor =
                obtenerRespuesta(
                  pregunta.id
                );

              return (
                <div
                  className="detail-answer"
                  key={pregunta.id}
                >

                  <span className="detail-question-number">
                    {index + 1}
                  </span>

                  <div className="detail-answer-content">

                    <strong>
                      {pregunta.texto}
                    </strong>

                    <span>
                      {mostrarRespuesta(
                        valor
                      )}
                    </span>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>

    </section>
  );
}

export default DetalleEncuesta;
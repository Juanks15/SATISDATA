import { useState } from 'react';
import Question from './Question';
import { preguntasDemo } from '../data/preguntasDemo';

function Survey({
  onCancel,
  onFinish,
}) {
  const preguntas = preguntasDemo
    .filter(
      (pregunta) =>
        pregunta.activa
    )
    .sort(
      (a, b) =>
        a.orden - b.orden
    );

  const [respuestas, setRespuestas] =
    useState({});

  const [preguntaActual, setPreguntaActual] =
    useState(0);

  const pregunta =
    preguntas[preguntaActual];

  const actualizarRespuesta = (
    preguntaId,
    valor
  ) => {

    setRespuestas(
      (actuales) => ({
        ...actuales,
        [preguntaId]: valor,
      })
    );
  };

  const avanzar = () => {

    if (
      pregunta.obligatoria &&
      (
        respuestas[pregunta.id] ===
          undefined ||
        respuestas[pregunta.id] ===
          '' ||
        (
          Array.isArray(
            respuestas[pregunta.id]
          ) &&
          respuestas[pregunta.id]
            .length === 0
        )
      )
    ) {

      alert(
        'Debe responder esta pregunta antes de continuar.'
      );

      return;
    }

    if (
      preguntaActual <
      preguntas.length - 1
    ) {

      setPreguntaActual(
        (actual) =>
          actual + 1
      );

    } else {

      onFinish(respuestas);

    }
  };

  const retroceder = () => {

    if (
      preguntaActual > 0
    ) {

      setPreguntaActual(
        (actual) =>
          actual - 1
      );

    }

  };

  const progreso =
    (
      (preguntaActual + 1) /
      preguntas.length
    ) *
    100;

  return (
    <section className="survey-section">

      <div className="survey-header">

        <button
          className="back-button"
          type="button"
          onClick={onCancel}
        >
          ← Cancelar encuesta
        </button>

        <span className="welcome-label">
          NUEVA ENCUESTA
        </span>

        <h2>
          Encuesta de satisfacción
        </h2>

        <p>
          Pregunta {preguntaActual + 1}
          {' '}de{' '}
          {preguntas.length}
        </p>

      </div>

      {/* PROGRESO */}

      <div className="survey-progress">

        <div
          className="survey-progress-bar"
          style={{
            width: `${progreso}%`,
          }}
        />

      </div>

      {/* PREGUNTA */}

      <div className="survey-form">

        <div className="question-number">
          Pregunta {preguntaActual + 1}
        </div>

        <Question
          pregunta={pregunta}
          valor={
            respuestas[
              pregunta.id
            ]
          }
          onChange={(event) =>
  actualizarRespuesta(
    pregunta.id,
    Number(event.target.value)
  )
}
        />

        {/* NAVEGACIÓN */}

        <div className="form-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={retroceder}
            disabled={
              preguntaActual === 0
            }
          >
            ← Anterior
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={avanzar}
          >
            {preguntaActual ===
            preguntas.length - 1
              ? 'Finalizar encuesta'
              : 'Siguiente →'}
          </button>

        </div>

      </div>

    </section>
  );
}

export default Survey;
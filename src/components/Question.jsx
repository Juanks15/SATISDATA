function Question({
  pregunta,
  valor,
  onChange,
}) {
  if (!pregunta.activa) {
    return null;
  }

  // ==========================================
  // TEXTO
  // ==========================================

  if (pregunta.tipo === 'texto') {
    return (
      <div className="question-group">

        <label>
          {pregunta.texto}

          {pregunta.obligatoria && (
            <span className="required">
              *
            </span>
          )}
        </label>

        <textarea
          rows="4"
          value={valor || ''}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="Escriba la respuesta..."
          required={pregunta.obligatoria}
        />

      </div>
    );
  }

  // ==========================================
  // SELECT
  // ==========================================

  if (pregunta.tipo === 'select') {
    return (
      <div className="question-group">

        <label>
          {pregunta.texto}

          {pregunta.obligatoria && (
            <span className="required">
              *
            </span>
          )}
        </label>

        <select
          value={valor || ''}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required={pregunta.obligatoria}
        >

          <option value="">
            Seleccione una opción
          </option>

          {pregunta.opciones.map(
            (opcion) => (
              <option
                key={opcion}
                value={opcion}
              >
                {opcion}
              </option>
            )
          )}

        </select>

      </div>
    );
  }

  // ==========================================
  // ESCALA
  // ==========================================

  if (pregunta.tipo === 'escala') {
    return (
      <div className="question-group">

        <label>
          {pregunta.texto}

          {pregunta.obligatoria && (
            <span className="required">
              *
            </span>
          )}
        </label>

        <div className="scale-options">

          {Array.from(
            {
              length:
                pregunta.maximo -
                pregunta.minimo +
                1,
            },
            (_, index) =>
              pregunta.minimo + index
          ).map((numero) => (

            <button
              key={numero}
              type="button"
              className={
                valor === numero
                  ? 'scale-option selected'
                  : 'scale-option'
              }
              onClick={() =>
                onChange(numero)
              }
            >
              {numero}
            </button>

          ))}

        </div>

        <div className="scale-labels">

          <span>
            Muy insatisfecho
          </span>

          <span>
            Muy satisfecho
          </span>

        </div>

      </div>
    );
  }

  // ==========================================
  // MÚLTIPLE
  // ==========================================

  if (pregunta.tipo === 'multiple') {

    const respuestas =
      Array.isArray(valor)
        ? valor
        : [];

    const cambiarOpcion = (
      opcion
    ) => {

      if (
        respuestas.includes(opcion)
      ) {

        onChange(
          respuestas.filter(
            (item) =>
              item !== opcion
          )
        );

      } else {

        onChange([
          ...respuestas,
          opcion,
        ]);

      }
    };

    return (
      <div className="question-group">

        <label>
          {pregunta.texto}

          {pregunta.obligatoria && (
            <span className="required">
              *
            </span>
          )}
        </label>

        <div className="multiple-options">

          {pregunta.opciones.map(
            (opcion) => (

              <label
                className="checkbox-option"
                key={opcion}
              >

                <input
                  type="checkbox"
                  checked={respuestas.includes(
                    opcion
                  )}
                  onChange={() =>
                    cambiarOpcion(
                      opcion
                    )
                  }
                />

                <span>
                  {opcion}
                </span>

              </label>

            )
          )}

        </div>

      </div>
    );
  }

  return null;
}

export default Question;
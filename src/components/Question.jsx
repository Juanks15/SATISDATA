function Question({
  pregunta,
  valor,
  onChange,
}) {
  if (!pregunta || !pregunta.activa) {
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
            <span className="required">*</span>
          )}
        </label>

        <textarea
          rows="4"
          value={valor ?? ''}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="Escriba la respuesta..."
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
            <span className="required">*</span>
          )}
        </label>

        <select
          value={valor ?? ''}
          onChange={(event) =>
            onChange(event.target.value)
          }
        >

          <option value="">
            Seleccione una opción
          </option>

          {(pregunta.opciones || []).map(
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
  // ESCALA 1 - 5
  // ==========================================

  if (pregunta.tipo === 'escala') {

  const minimo = pregunta.minimo ?? 1;
  const maximo = pregunta.maximo ?? 5;

  const opciones = [];

  for (
    let numero = minimo;
    numero <= maximo;
    numero++
  ) {
    opciones.push(numero);
  }

  const etiquetas = {
    1: 'Muy insatisfecho',
    2: 'Insatisfecho',
    3: 'Neutral',
    4: 'Satisfecho',
    5: 'Muy satisfecho',
  };

  const etiquetaSeleccionada =
    valor !== undefined &&
    valor !== '' &&
    valor !== null
      ? etiquetas[Number(valor)] || `Valor ${valor}`
      : '';

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

        {opciones.map((numero) => {

          const seleccionado =
            Number(valor) === Number(numero);

          return (
            <button
              key={numero}
              type="button"
              className={
                seleccionado
                  ? 'scale-option selected'
                  : 'scale-option'
              }
              onClick={() =>
                onChange(numero)
              }
              aria-label={
                etiquetas[numero] ||
                `Valor ${numero}`
              }
            >
              <span className="scale-number">
                {numero}
              </span>
            </button>
          );
        })}

      </div>

      <div className="scale-labels">

        <span>
          Muy insatisfecho
        </span>

        <span>
          Muy satisfecho
        </span>

      </div>

      {etiquetaSeleccionada && (

        <div className="scale-selected">

          <span className="scale-selected-check">
            ✓
          </span>

          <span>
            {etiquetaSeleccionada}
          </span>

        </div>

      )}

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

    const cambiarOpcion = (opcion) => {

      if (respuestas.includes(opcion)) {

        onChange(
          respuestas.filter(
            (item) => item !== opcion
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
            <span className="required">*</span>
          )}
        </label>

        <div className="multiple-options">

          {(pregunta.opciones || []).map(
            (opcion) => (

              <label
                className="checkbox-option"
                key={opcion}
              >

                <input
                  type="checkbox"
                  checked={respuestas.includes(opcion)}
                  onChange={() =>
                    cambiarOpcion(opcion)
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
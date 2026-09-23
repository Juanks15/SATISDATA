import { db } from '../db/database';

export async function crearEncuesta({
  encuesta,
  respuestas,
}) {
  if (!encuesta) {
    throw new Error(
      'Los datos de la encuesta son obligatorios.'
    );
  }

  const encuestaId = await db.transaction(
    'rw',
    db.encuestas,
    db.respuestas,
    async () => {
      const id = await db.encuestas.add(encuesta);

      const respuestasParaGuardar = Object.entries(
        respuestas || {}
      ).map(([preguntaId, respuesta]) => ({
        encuestaId: id,
        preguntaId: Number(preguntaId),
        respuesta,
      }));

      if (respuestasParaGuardar.length > 0) {
        await db.respuestas.bulkAdd(
          respuestasParaGuardar
        );
      }

      return id;
    }
  );

  return encuestaId;
}

export async function obtenerEncuestas() {
  return db.encuestas
    .orderBy('fechaCreacion')
    .reverse()
    .toArray();
}

export async function obtenerEncuestaPorId(
  encuestaId
) {
  if (!encuestaId) {
    return null;
  }

  const encuesta = await db.encuestas.get(
    encuestaId
  );

  if (!encuesta) {
    return null;
  }

  const respuestas = await db.respuestas
    .where('encuestaId')
    .equals(encuestaId)
    .toArray();

  return {
    ...encuesta,
    respuestas,
  };
}

export async function eliminarEncuesta(
  encuestaId
) {
  if (!encuestaId) {
    return;
  }

  await db.transaction(
    'rw',
    db.encuestas,
    db.respuestas,
    async () => {
      await db.respuestas
        .where('encuestaId')
        .equals(encuestaId)
        .delete();

      await db.encuestas.delete(encuestaId);
    }
  );
}
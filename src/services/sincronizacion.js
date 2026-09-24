import { db } from '../db/database';

const ESTADOS = {
  PENDIENTE: 'pendiente',
  SINCRONIZANDO: 'sincronizando',
  SINCRONIZADA: 'sincronizada',
  ERROR: 'error',
};

export async function obtenerEncuestasPendientes() {
  return db.encuestas
    .where('estadoSincronizacion')
    .equals(ESTADOS.PENDIENTE)
    .toArray();
}

export async function obtenerEncuestaParaSincronizar(
  encuestaId
) {
  if (!encuestaId) {
    return null;
  }

  const encuesta =
    await db.encuestas.get(encuestaId);

  if (!encuesta) {
    return null;
  }

  const respuestas =
    await db.respuestas
      .where('encuestaId')
      .equals(encuestaId)
      .toArray();

  return {
    encuesta,
    respuestas,
  };
}

export async function marcarComoSincronizando(
  encuestaId
) {
  if (!encuestaId) {
    return;
  }

  await db.encuestas.update(encuestaId, {
    estadoSincronizacion:
      ESTADOS.SINCRONIZANDO,
  });
}

export async function marcarComoSincronizada(
  encuestaId
) {
  if (!encuestaId) {
    return;
  }

  await db.encuestas.update(encuestaId, {
    estadoSincronizacion:
      ESTADOS.SINCRONIZADA,
  });
}

export async function marcarComoError(
  encuestaId
) {
  if (!encuestaId) {
    return;
  }

  await db.encuestas.update(encuestaId, {
    estadoSincronizacion:
      ESTADOS.ERROR,
  });
}

export function construirPayloadEncuesta(
  encuesta,
  respuestas
) {
  if (!encuesta) {
    throw new Error(
      'Los datos de la encuesta son obligatorios.'
    );
  }

  return {
    encuesta: {
      idLocal: encuesta.id,
      codigo: encuesta.codigo,
      fechaCreacion:
        encuesta.fechaCreacion,
      departamento:
        encuesta.departamento,
      municipio:
        encuesta.municipio,
      departamentoCodigo:
        encuesta.departamentoCodigo,
      municipioCodigo:
        encuesta.municipioCodigo,
      municipioCodigoCompleto:
        encuesta.municipioCodigoCompleto,
      observacion:
        encuesta.observacion,
      funcionarioId:
        encuesta.funcionarioId,
    },

    respuestas: (respuestas || []).map(
      (respuesta) => ({
        preguntaId:
          respuesta.preguntaId,
        respuesta:
          respuesta.respuesta,
      })
    ),
  };
}

export {
  ESTADOS as ESTADOS_SINCRONIZACION,
};
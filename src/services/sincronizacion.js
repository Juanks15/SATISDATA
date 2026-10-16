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
    .anyOf([
      ESTADOS.PENDIENTE,
      ESTADOS.ERROR,
    ])
    .toArray();
}
export async function recuperarSincronizacionesInterrumpidas() {
  const interrumpidas = await db.encuestas
    .where('estadoSincronizacion')
    .equals(ESTADOS.SINCRONIZANDO)
    .toArray();

  if (interrumpidas.length === 0) {
    return 0;
  }

  await db.transaction('rw', db.encuestas, async () => {
    for (const encuesta of interrumpidas) {
      await db.encuestas.update(encuesta.id, {
        estadoSincronizacion: ESTADOS.ERROR,
        ultimoErrorSincronizacion:
          'La sincronización anterior se interrumpió. Puede reintentarse.',
      });
    }
  });

  return interrumpidas.length;
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

  const encuesta =
    await db.encuestas.get(encuestaId);

  if (!encuesta) {
    return;
  }

  await db.encuestas.update(encuestaId, {
    estadoSincronizacion:
      ESTADOS.SINCRONIZANDO,

    intentosSincronizacion:
      (encuesta.intentosSincronizacion || 0) + 1,

    ultimoErrorSincronizacion:
      null,
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

    fechaSincronizacion:
      new Date().toISOString(),

    ultimoErrorSincronizacion:
      null,
  });
}

export async function marcarComoError(
  encuestaId,
  mensajeError
) {
  if (!encuestaId) {
    return;
  }

  await db.encuestas.update(encuestaId, {
    estadoSincronizacion:
      ESTADOS.ERROR,

    ultimoErrorSincronizacion:
      mensajeError ||
      'Error desconocido durante la sincronización.',
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
    idLocal: encuesta.id,

    codigo:
      encuesta.codigo,

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

    respuestas:
      (respuestas || []).map(
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
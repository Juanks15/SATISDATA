import { db } from '../db/database';

const ESTADO_BORRADOR_ACTIVO = 'activo';

/**
 * Estructura inicial de un nuevo borrador.
 *
 * Mantener esta estructura centralizada evita que
 * diferentes partes de la aplicación creen borradores
 * con propiedades diferentes.
 */
const crearDatosIniciales = () => ({
  formulario: {
    departamento: '',
    municipio: '',
    observacion: '',
    departamentoCodigo: '',
    municipioCodigo: '',
    municipioCodigoCompleto: '',
  },

  respuestas: {},
});

/**
 * Obtiene todos los borradores activos y devuelve
 * el más recientemente actualizado.
 *
 * SATISDATA actualmente trabaja con un único flujo
 * activo de encuesta. Por eso se recupera el borrador
 * más reciente.
 */
export async function obtenerBorradorActivo() {
  const borradores = await db.borradores
    .where('estado')
    .equals(ESTADO_BORRADOR_ACTIVO)
    .toArray();

  if (borradores.length === 0) {
    return null;
  }

  return borradores.sort(
    (a, b) =>
      new Date(b.fechaActualizacion) -
      new Date(a.fechaActualizacion)
  )[0];
}

/**
 * Crea un nuevo borrador local.
 */
export async function crearBorrador() {
  const ahora = new Date().toISOString();

  const datosIniciales = crearDatosIniciales();

  const borrador = {
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
    funcionarioId: null,
    estado: ESTADO_BORRADOR_ACTIVO,

    formulario: datosIniciales.formulario,
    respuestas: datosIniciales.respuestas,
  };

  const id = await db.borradores.add(borrador);

  return {
    id,
    ...borrador,
  };
}

/**
 * Actualiza la información de un borrador existente.
 */
export async function actualizarBorrador(
  borradorId,
  formulario,
  respuestas
) {
  if (!borradorId) {
    return;
  }

  await db.borradores.update(borradorId, {
    fechaActualizacion: new Date().toISOString(),

    formulario: {
      ...formulario,
    },

    respuestas: {
      ...respuestas,
    },
  });
}

/**
 * Obtiene un borrador específico por su ID.
 */
export async function obtenerBorradorPorId(
  borradorId
) {
  if (!borradorId) {
    return null;
  }

  return db.borradores.get(borradorId);
}

/**
 * Elimina un borrador.
 */
export async function eliminarBorrador(
  borradorId
) {
  if (!borradorId) {
    return;
  }

  await db.borradores.delete(borradorId);
}
import Dexie from 'dexie';

export const db = new Dexie('SATISDATA');

/*
 * ==========================================================
 * VERSIÓN 1
 * Estructura inicial de SATISDATA
 * ==========================================================
 */
db.version(1).stores({
  encuestas:
    '++id, codigo, fechaCreacion, departamento, municipio, funcionarioId, estadoSincronizacion',

  preguntas:
    '++id, codigo, orden, activa',

  respuestas:
    '++id, encuestaId, preguntaId',

  funcionarios:
    '++id, correo, rol',

  sincronizaciones:
    '++id, fecha, estado',
});

/*
 * ==========================================================
 * VERSIÓN 2
 * Catálogo geográfico local
 * ==========================================================
 */
db.version(2).stores({
  encuestas:
    '++id, codigo, fechaCreacion, departamento, municipio, funcionarioId, estadoSincronizacion',

  preguntas:
    '++id, codigo, orden, activa',

  respuestas:
    '++id, encuestaId, preguntaId',

  funcionarios:
    '++id, correo, rol',

  sincronizaciones:
    '++id, fecha, estado',

  departamentos:
    '++id, codigo, nombre',

  municipios:
    '++id, codigo, codigoDepartamento, nombre',
});

/*
 * ==========================================================
 * VERSIÓN 3
 * Borradores y preparación para sincronización
 * ==========================================================
 */
db.version(3).stores({
  encuestas:
    '++id, codigo, fechaCreacion, departamento, municipio, funcionarioId, estadoSincronizacion',

  preguntas:
    '++id, codigo, orden, activa',

  respuestas:
    '++id, encuestaId, preguntaId',

  funcionarios:
    '++id, correo, rol',

  sincronizaciones:
    '++id, fecha, estado',

  departamentos:
    '++id, codigo, nombre',

  municipios:
    '++id, codigo, codigoDepartamento, nombre',

  borradores:
    '++id, fechaCreacion, fechaActualizacion, funcionarioId, estado',
});
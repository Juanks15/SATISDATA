import Dexie from 'dexie';

export const db = new Dexie('SATISDATA');

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
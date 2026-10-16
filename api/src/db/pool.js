const { Pool } = require('pg');

let pool;

function getPool() {
  const requeridas = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  const faltantes = requeridas.filter(
    (nombre) => !process.env[nombre]
  );

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de base de datos: ${faltantes.join(', ')}`
    );
  }

  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
      ssl: {
  rejectUnauthorized: false,
},
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }

  return pool;
}

module.exports = { getPool };
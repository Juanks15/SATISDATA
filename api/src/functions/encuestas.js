const { app } = require('@azure/functions');
const { getPool } = require('../db/pool');
const { validarToken } = require('../middleware/validarToken');
app.http('crearEncuesta', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'encuestas',

  handler: async (request, context) => {
    const resultadoAuth = await validarToken(request);

if (!resultadoAuth.ok) {
  return {
    status: resultadoAuth.status,
    headers: {
      'WWW-Authenticate': 'Bearer',
    },
    jsonBody: {
      ok: false,
      persistida: false,
      mensaje: resultadoAuth.mensaje,
    },
  };
}

let body;

    try {
      body = await request.json();
    } catch {
      return {
        status: 400,
        jsonBody: {
          ok: false,
          persistida: false,
          mensaje: 'El cuerpo no contiene un JSON válido.',
        },
      };
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return {
        status: 400,
        jsonBody: {
          ok: false,
          persistida: false,
          mensaje: 'El cuerpo debe ser un objeto JSON.',
        },
      };
    }

    const {
      idLocal,
      codigo,
      fechaCreacion,
      departamento,
      municipio,
      departamentoCodigo,
      municipioCodigo,
      municipioCodigoCompleto,
      observacion,
      funcionarioId,
      respuestas,
    } = body;

    if (
      typeof codigo !== 'string' ||
      !codigo.trim() ||
      codigo.length > 100
    ) {
      return {
        status: 400,
        jsonBody: {
          ok: false,
          persistida: false,
          mensaje: 'El código de encuesta es obligatorio y debe tener máximo 100 caracteres.',
        },
      };
    }

    if (
      typeof departamento !== 'string' ||
      !departamento.trim() ||
      typeof municipio !== 'string' ||
      !municipio.trim()
    ) {
      return {
        status: 400,
        jsonBody: {
          ok: false,
          persistida: false,
          mensaje: 'El departamento y el municipio son obligatorios.',
        },
      };
    }

    if (!Array.isArray(respuestas)) {
      return {
        status: 400,
        jsonBody: {
          ok: false,
          persistida: false,
          mensaje: 'Las respuestas deben enviarse en un arreglo.',
        },
      };
    }

    const localId =
      idLocal == null ? null : Number(idLocal);

    if (
      localId !== null &&
      (!Number.isSafeInteger(localId) || localId < 1)
    ) {
      return {
        status: 400,
        jsonBody: {
          ok: false,
          persistida: false,
          mensaje: 'El identificador local no es válido.',
        },
      };
    }

    let fecha = null;

    if (fechaCreacion != null) {
      fecha = new Date(fechaCreacion);

      if (Number.isNaN(fecha.getTime())) {
        return {
          status: 400,
          jsonBody: {
            ok: false,
            persistida: false,
            mensaje: 'La fecha de creación no es válida.',
          },
        };
      }
    }

    const respuestasNormalizadas = [];
    const preguntasVistas = new Set();

    for (const item of respuestas) {
      const preguntaId = Number(item?.preguntaId);

      if (
        !Number.isSafeInteger(preguntaId) ||
        preguntaId < 1 ||
        !Object.prototype.hasOwnProperty.call(
          item ?? {},
          'respuesta'
        )
      ) {
        return {
          status: 400,
          jsonBody: {
            ok: false,
            persistida: false,
            mensaje: 'Cada respuesta debe incluir un preguntaId válido y una respuesta.',
          },
        };
      }

      if (preguntasVistas.has(preguntaId)) {
        return {
          status: 400,
          jsonBody: {
            ok: false,
            persistida: false,
            mensaje: `La pregunta ${preguntaId} aparece más de una vez.`,
          },
        };
      }

      preguntasVistas.add(preguntaId);

      respuestasNormalizadas.push({
        preguntaId,
        respuesta: item.respuesta,
      });
    }

    let client;
    let transaccionActiva = false;

    try {
      const pool = getPool();

      client = await pool.connect();

      await client.query('BEGIN');
      transaccionActiva = true;

      const insercion = await client.query(
        `INSERT INTO encuestas (
          id_local,
          codigo,
          fecha_creacion,
          departamento,
          municipio,
          departamento_codigo,
          municipio_codigo,
          municipio_codigo_completo,
          observacion,
          funcionario_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (codigo) DO NOTHING
        RETURNING id, id_local, codigo, fecha_recepcion`,
        [
          localId,
          codigo.trim(),
          fecha,
          departamento.trim(),
          municipio.trim(),
          departamentoCodigo ?? null,
          municipioCodigo ?? null,
          municipioCodigoCompleto ?? null,
          observacion == null ? '' : String(observacion),
          funcionarioId == null ? null : String(funcionarioId),
        ]
      );

      // Si el código ya existe, tratamos el envío como
      // un reintento idempotente: no volvemos a insertar.
      if (insercion.rowCount === 0) {
        const existente = await client.query(
          `SELECT id, id_local, codigo, fecha_recepcion
           FROM encuestas
           WHERE codigo = $1`,
          [codigo.trim()]
        );

        if (existente.rowCount === 0) {
          throw new Error(
            'No fue posible recuperar la encuesta existente.'
          );
        }

        const encuesta = existente.rows[0];

        const conteo = await client.query(
          `SELECT COUNT(*)::int AS cantidad
           FROM respuestas
           WHERE encuesta_id = $1`,
          [encuesta.id]
        );

        await client.query('COMMIT');
        transaccionActiva = false;

        return {
          status: 200,
          jsonBody: {
            ok: true,
            persistida: true,
            duplicada: true,
            mensaje: 'La encuesta ya estaba guardada en el servidor.',
            encuesta,
            cantidadRespuestas: conteo.rows[0].cantidad,
            fechaRecepcion: encuesta.fecha_recepcion,
          },
        };
      }

      const encuesta = insercion.rows[0];

      for (const item of respuestasNormalizadas) {
        await client.query(
          `INSERT INTO respuestas (
            encuesta_id,
            pregunta_id,
            respuesta
          )
          VALUES ($1, $2, $3::jsonb)`,
          [
            encuesta.id,
            item.preguntaId,
            JSON.stringify(item.respuesta),
          ]
        );
      }

      await client.query('COMMIT');
      transaccionActiva = false;

      context.log(
        `Encuesta guardada: ${encuesta.codigo}; respuestas: ${respuestasNormalizadas.length}`
      );

      return {
        status: 201,
        jsonBody: {
          ok: true,
          persistida: true,
          duplicada: false,
          mensaje: 'Encuesta y respuestas guardadas correctamente.',
          encuesta: {
            id: encuesta.id,
            idLocal: encuesta.id_local,
            codigo: encuesta.codigo,
          },
          cantidadRespuestas: respuestasNormalizadas.length,
          fechaRecepcion: encuesta.fecha_recepcion,
        },
      };
    } catch (error) {
      if (client && transaccionActiva) {
        await client.query('ROLLBACK').catch(
          (rollbackError) => {
            context.error(
              'Error revirtiendo la transacción:',
              rollbackError
            );
          }
        );
      }

      context.error(
        'Error guardando la encuesta en PostgreSQL:',
        error
      );

      return {
        status: 500,
        jsonBody: {
          ok: false,
          persistida: false,
          mensaje: 'No fue posible guardar la encuesta en el servidor.',
        },
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  },
});
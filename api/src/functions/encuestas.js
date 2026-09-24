const { app } = require('@azure/functions');

app.http('crearEncuesta', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'encuestas',
    handler: async (request, context) => {
        try {
            const body = await request.json();

            const {
                codigo,
                fechaCreacion,
                departamento,
                municipio,
                departamentoCodigo,
                municipioCodigo,
                municipioCodigoCompleto,
                observacion,
                respuestas,
            } = body;

            if (!codigo) {
                return {
                    status: 400,
                    jsonBody: {
                        ok: false,
                        mensaje: 'El campo codigo es obligatorio.',
                    },
                };
            }

            if (!departamento || !municipio) {
                return {
                    status: 400,
                    jsonBody: {
                        ok: false,
                        mensaje: 'El departamento y el municipio son obligatorios.',
                    },
                };
            }

            if (!Array.isArray(respuestas)) {
                return {
                    status: 400,
                    jsonBody: {
                        ok: false,
                        mensaje: 'El campo respuestas debe ser un arreglo.',
                    },
                };
            }

            context.log(`Encuesta recibida: ${codigo}`);

            return {
                status: 201,
                jsonBody: {
                    ok: true,
                    mensaje: 'Encuesta recibida correctamente.',
                    encuesta: {
                        codigo,
                        fechaCreacion: fechaCreacion ?? null,
                        departamento,
                        municipio,
                        departamentoCodigo: departamentoCodigo ?? null,
                        municipioCodigo: municipioCodigo ?? null,
                        municipioCodigoCompleto:
                            municipioCodigoCompleto ?? null,
                        observacion: observacion ?? '',
                    },
                    cantidadRespuestas: respuestas.length,
                    fechaRecepcion: new Date().toISOString(),
                },
            };
        } catch (error) {
            context.error('Error procesando la encuesta:', error);

            return {
                status: 400,
                jsonBody: {
                    ok: false,
                    mensaje: 'El cuerpo de la solicitud no contiene un JSON válido.',
                },
            };
        }
    },
});
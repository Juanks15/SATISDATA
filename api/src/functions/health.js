const { app } = require('@azure/functions');

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: async (request, context) => {
        context.log('Health check de SATISDATA ejecutado.');

        return {
            status: 200,
            jsonBody: {
                ok: true,
                servicio: 'SATISDATA API',
                estado: 'operativo',
                fecha: new Date().toISOString(),
            },
        };
    },
});
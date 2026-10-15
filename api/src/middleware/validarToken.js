
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const tenantId = process.env.ENTRA_TENANT_ID;
const apiClientId = process.env.ENTRA_API_CLIENT_ID;
const requiredScope =
  process.env.ENTRA_API_SCOPE || 'access_as_user';

const clientesJwks = new Map();

function obtenerCliente(version) {
  if (!clientesJwks.has(version)) {
    const rutaClaves =
      version === '2.0'
        ? 'discovery/v2.0/keys'
        : 'discovery/keys';

    const cliente = jwksRsa({
      jwksUri:
        `https://login.microsoftonline.com/${tenantId}/${rutaClaves}`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      timeout: 5000,
    });

    clientesJwks.set(version, cliente);
  }

  return clientesJwks.get(version);
}

function noAutorizado(
  status,
  mensaje
) {
  return {
    ok: false,
    status,
    mensaje,
  };
}

async function validarToken(request) {
  if (!tenantId || !apiClientId || !requiredScope) {
    return noAutorizado(
      500,
      'La autenticación de la API no está configurada.'
    );
  }

  const autorizacion =
    request.headers.get('authorization');

  if (
    !autorizacion ||
    !/^Bearer\s+\S+$/i.test(autorizacion)
  ) {
    return noAutorizado(
      401,
      'Se requiere un token de acceso válido.'
    );
  }

  const token = autorizacion
    .replace(/^Bearer\s+/i, '')
    .trim();

  const decodificado = jwt.decode(token, {
    complete: true,
  });

  if (
    !decodificado ||
    !decodificado.header ||
    !decodificado.payload ||
    typeof decodificado.payload !== 'object' ||
    Array.isArray(decodificado.payload)
  ) {
    return noAutorizado(
      401,
      'El token de acceso no es válido.'
    );
  }

  const { header, payload } = decodificado;
  const version = payload.ver;

  // Estos datos todavía no son confiables.
  // Se usan únicamente para seleccionar la clave
  // y las reglas de validación correspondientes.
  if (
    header.alg !== 'RS256' ||
    typeof header.kid !== 'string' ||
    !['1.0', '2.0'].includes(version) ||
    payload.tid !== tenantId
  ) {
    return noAutorizado(
      401,
      'El token no corresponde al inquilino autorizado.'
    );
  }

  let clavePublica;

  try {
    const cliente = obtenerCliente(version);
    const clave = await cliente.getSigningKey(header.kid);

    clavePublica = clave.getPublicKey();
  } catch {
    return noAutorizado(
      503,
      'No fue posible verificar el token con Microsoft en este momento.'
    );
  }

  let claims;

  const emisorEsperado =
    version === '2.0'
      ? `https://login.microsoftonline.com/${tenantId}/v2.0`
      : `https://sts.windows.net/${tenantId}/`;

  try {
    claims = jwt.verify(token, clavePublica, {
      algorithms: ['RS256'],
      issuer: emisorEsperado,
      audience: [
        apiClientId,
        `api://${apiClientId}`,
      ],
      clockTolerance: 5,
    });
  } catch {
    return noAutorizado(
      401,
      'El token es inválido, ha expirado o no corresponde a esta API.'
    );
  }

  // Verificar nuevamente el inquilino después
  // de comprobar la firma y los claims.
  if (claims.tid !== tenantId) {
    return noAutorizado(
      401,
      'El inquilino del token no está autorizado.'
    );
  }

  // La API exige el permiso delegado de SATISDATA.
  const scopes =
    typeof claims.scp === 'string'
      ? claims.scp.split(/\s+/).filter(Boolean)
      : [];

  if (!scopes.includes(requiredScope)) {
    return noAutorizado(
      403,
      'El token no contiene el permiso requerido para utilizar SATISDATA.'
    );
  }

  return {
    ok: true,
    claims,
  };
}

module.exports = {
  validarToken,
};

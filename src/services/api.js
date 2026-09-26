import { loginRequest } from '../auth/msalConfig';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error(
    'Falta la variable VITE_API_URL para SATISDATA.',
  );
}

/**
 * Obtiene un access token para consumir SATISDATA API.
 */
export async function obtenerAccessToken(
  instance,
  account,
) {
  const cuenta =
    account ||
    instance.getActiveAccount() ||
    instance.getAllAccounts()[0];

  if (!cuenta) {
    throw new Error(
      'No existe una cuenta autenticada.',
    );
  }

  const response =
    await instance.acquireTokenSilent({
      ...loginRequest,
      account: cuenta,
    });

  return response.accessToken;
}

/**
 * Comprueba la conexión con la API protegida.
 */
export async function consultarHealth(
  accessToken,
) {
  const response = await fetch(
    `${API_URL}/api/health`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const cuerpo = await response.text();

    const detalle =
      response.headers.get(
        'WWW-Authenticate',
      );

    throw new Error(
      [
        `La API respondió con HTTP ${response.status}.`,
        detalle
          ? `WWW-Authenticate: ${detalle}`
          : null,
        cuerpo
          ? `Respuesta: ${cuerpo}`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return response.json();
}
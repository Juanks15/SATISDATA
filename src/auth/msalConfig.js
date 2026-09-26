const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID;
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const apiScope = import.meta.env.VITE_ENTRA_API_SCOPE;

const appUrl = import.meta.env.PROD
  ? 'https://juanks15.github.io/SATISDATA/'
  : 'http://localhost:5173/SATISDATA/';

const redirectUri = import.meta.env.PROD
  ? 'https://juanks15.github.io/SATISDATA/redirect.html'
  : 'http://localhost:5173/SATISDATA/redirect.html';

if (!tenantId || !clientId || !apiScope) {
  throw new Error(
    'Faltan variables de entorno de Microsoft Entra ID para SATISDATA.',
  );
}

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: appUrl,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [apiScope],
};
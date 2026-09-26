import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { registerSW } from 'virtual:pwa-register';

import './index.css';
import App from './App.jsx';
import { msalConfig } from './auth/msalConfig';

// Registro del Service Worker para funcionamiento offline
registerSW({
  immediate: true,
});

const msalInstance = new PublicClientApplication(
  msalConfig
);

async function iniciarAplicacion() {
  try {
    await msalInstance.initialize();

    const cuentas =
      msalInstance.getAllAccounts();

    if (cuentas.length > 0) {
      msalInstance.setActiveAccount(
        cuentas[0]
      );
    }

    createRoot(
      document.getElementById('root')
    ).render(
      <StrictMode>
        <MsalProvider
          instance={msalInstance}
        >
          <App />
        </MsalProvider>
      </StrictMode>,
    );
  } catch (error) {
    console.error(
      'Error inicializando Microsoft Entra ID:',
      error,
    );

    const root =
      document.getElementById('root');

    if (root) {
      root.innerHTML = `
        <div style="padding: 2rem; font-family: sans-serif;">
          <h1>No fue posible iniciar SATISDATA</h1>
          <p>
            Ocurrió un problema al inicializar
            el servicio de autenticación.
          </p>
        </div>
      `;
    }
  }
}

iniciarAplicacion();
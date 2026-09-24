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

const msalInstance = new PublicClientApplication(msalConfig);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>,
);
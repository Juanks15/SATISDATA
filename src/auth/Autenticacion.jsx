import { useState } from 'react';
import {
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import {
  useIsAuthenticated,
  useMsal,
} from '@azure/msal-react';

import { loginRequest } from './msalConfig';
import {
  obtenerAccessToken,
  consultarHealth,
} from '../services/api';

function Autenticacion({ onAutenticado }) {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [estadoApi, setEstadoApi] = useState('');
  const [probandoApi, setProbandoApi] = useState(false);

  const iniciarSesion = async () => {
    try {
      const response =
        await instance.loginPopup(loginRequest);

      if (response?.account) {
        instance.setActiveAccount(response.account);

        if (onAutenticado) {
          onAutenticado(response.account);
        }
      }
    } catch (error) {
      console.error(
        'Error iniciando sesión con Microsoft:',
        error,
      );

      alert(
        'No fue posible iniciar sesión con Microsoft.',
      );
    }
  };

  const probarApi = async () => {
    try {
      setProbandoApi(true);
      setEstadoApi('');

      const account =
        instance.getActiveAccount() ||
        instance.getAllAccounts()[0];

      if (!account) {
        throw new Error(
          'No existe una cuenta autenticada.',
        );
      }

      instance.setActiveAccount(account);

      let accessToken;

      try {
        accessToken = await obtenerAccessToken(
          instance,
          account,
        );
      } catch (error) {
        if (
          error instanceof InteractionRequiredAuthError
        ) {
          const response =
            await instance.acquireTokenPopup({
              ...loginRequest,
              account,
            });

          accessToken = response.accessToken;
        } else {
          throw error;
        }
      }

      const data =
        await consultarHealth(accessToken);

      console.log(
        'Respuesta autenticada de la API:',
        data,
      );

      setEstadoApi(
        `API OK: ${data.estado}`,
      );
    } catch (error) {
      console.error(
        'Error llamando a la API:',
        error,
      );

      setEstadoApi(
        error.message ||
          'No fue posible conectar con la API.',
      );
    } finally {
      setProbandoApi(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await instance.logoutRedirect({
        account: instance.getActiveAccount(),
        postLogoutRedirectUri:
          import.meta.env.PROD
            ? 'https://juanks15.github.io/SATISDATA/'
            : 'http://localhost:5173/SATISDATA/',
      });
    } catch (error) {
      console.error(
        'Error cerrando sesión:',
        error,
      );

      alert(
        'No fue posible cerrar la sesión.',
      );
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <button
          type="button"
          className="login-button"
          onClick={iniciarSesion}
        >
          Ingresar con Microsoft
        </button>
      ) : (
        <>
          <button
            type="button"
            className="login-button"
            onClick={probarApi}
            disabled={probandoApi}
          >
            {probandoApi
              ? 'Probando API...'
              : 'Probar API protegida'}
          </button>

          {estadoApi && (
            <div
              style={{
                marginTop: '0.75rem',
              }}
            >
              {estadoApi}
            </div>
          )}

          <button
            type="button"
            className="login-button"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </>
      )}
    </>
  );
}

export default Autenticacion;
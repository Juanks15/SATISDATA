import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  InteractionRequiredAuthError,
} from '@azure/msal-browser';

import { useMsal } from '@azure/msal-react';

import { loginRequest } from '../auth/msalConfig';

import {
  obtenerAccessToken,
  enviarEncuesta,
} from '../services/api';

import {
  obtenerEncuestasPendientes,
  obtenerEncuestaParaSincronizar,
  construirPayloadEncuesta,
  marcarComoSincronizando,
  marcarComoSincronizada,
  marcarComoError,
} from '../services/sincronizacion';

export function useSincronizacion() {
  const { instance } = useMsal();

  const [online, setOnline] = useState(
    navigator.onLine
  );

  const [
    pendientes,
    setPendientes,
  ] = useState(0);

  const [
    sincronizando,
    setSincronizando,
  ] = useState(false);

  const [
    errorSincronizacion,
    setErrorSincronizacion,
  ] = useState('');

  const actualizarPendientes =
    useCallback(async () => {
      try {
        setErrorSincronizacion('');

        const encuestas =
          await obtenerEncuestasPendientes();

        setPendientes(
          encuestas.length
        );

        return encuestas;
      } catch (error) {
        console.error(
          'Error consultando encuestas pendientes:',
          error
        );

        setErrorSincronizacion(
          'No fue posible consultar las encuestas pendientes.'
        );

        return [];
      }
    }, []);

  useEffect(() => {
    const manejarOnline = () => {
      setOnline(true);
      actualizarPendientes();
    };

    const manejarOffline = () => {
      setOnline(false);
    };

    window.addEventListener(
      'online',
      manejarOnline
    );

    window.addEventListener(
      'offline',
      manejarOffline
    );

    return () => {
      window.removeEventListener(
        'online',
        manejarOnline
      );

      window.removeEventListener(
        'offline',
        manejarOffline
      );
    };
  }, [actualizarPendientes]);

  useEffect(() => {
  let cancelado = false;

  const cargarPendientesInicialmente = async () => {
    try {
      const encuestas =
        await obtenerEncuestasPendientes();

      if (cancelado) return;

      setPendientes(encuestas.length);
      setErrorSincronizacion('');

    } catch (error) {
      if (cancelado) return;

      console.error(
        'Error consultando encuestas pendientes:',
        error
      );

      setErrorSincronizacion(
        'No fue posible consultar las encuestas pendientes.'
      );
    }
  };

  void cargarPendientesInicialmente();

  return () => {
    cancelado = true;
  };
}, []);

  const sincronizar = useCallback(
    async () => {
      if (!online) {
        setErrorSincronizacion(
          'No hay conexión a internet.'
        );

        return;
      }

      if (sincronizando) {
        return;
      }

      try {
        setSincronizando(true);
        setErrorSincronizacion('');

        const account =
          instance.getActiveAccount() ||
          instance.getAllAccounts()[0];

        if (!account) {
          throw new Error(
            'No existe una cuenta autenticada.'
          );
        }

        instance.setActiveAccount(account);

        // ==========================================
        // OBTENER TOKEN
        // ==========================================

        let accessToken;

        try {
          accessToken =
            await obtenerAccessToken(
              instance,
              account
            );
        } catch (error) {
          if (
            error instanceof
            InteractionRequiredAuthError
          ) {
            const response =
              await instance.acquireTokenPopup({
                ...loginRequest,
                account,
              });

            accessToken =
              response.accessToken;
          } else {
            throw error;
          }
        }

        if (!accessToken) {
          throw new Error(
            'No fue posible obtener el access token.'
          );
        }

        // ==========================================
        // OBTENER ENCUESTAS
        // ==========================================

        const encuestas =
          await obtenerEncuestasPendientes();

        if (encuestas.length === 0) {
          setPendientes(0);
          return;
        }

        // ==========================================
        // SINCRONIZAR UNA POR UNA
        // ==========================================

        for (const encuesta of encuestas) {
          try {
            await marcarComoSincronizando(
              encuesta.id
            );

            const datos =
              await obtenerEncuestaParaSincronizar(
                encuesta.id
              );

            if (!datos) {
              throw new Error(
                `No fue posible obtener la encuesta local ${encuesta.id}.`
              );
            }

            const payload =
              construirPayloadEncuesta(
                datos.encuesta,
                datos.respuestas
              );

            console.log(
              'Enviando encuesta:',
              payload.codigo
            );

            const resultado = await enviarEncuesta(
  accessToken,
  payload
);

console.log(
  'Respuesta de la API:',
  resultado
);

if (!resultado?.ok) {
  throw new Error(
    resultado?.mensaje ||
      'La API no confirmó la recepción de la encuesta.'
  );
}

if (resultado.persistida !== true) {
  throw new Error(
    'La API recibió la encuesta, pero todavía no confirmó su almacenamiento permanente.'
  );
}

await marcarComoSincronizada(encuesta.id);

            await marcarComoSincronizada(
              encuesta.id
            );

          } catch (error) {
            console.error(
              `Error sincronizando encuesta ${encuesta.id}:`,
              error
            );

            await marcarComoError(
              encuesta.id,
              error.message
            );
          }
        }

        await actualizarPendientes();

      } catch (error) {
        console.error(
          'Error durante la sincronización:',
          error
        );

        setErrorSincronizacion(
          error.message ||
          'No fue posible completar la sincronización.'
        );
      } finally {
        setSincronizando(false);
      }
    },
    [
      instance,
      online,
      sincronizando,
      actualizarPendientes,
    ]
  );

  return {
    online,
    pendientes,
    sincronizando,
    errorSincronizacion,
    actualizarPendientes,
    sincronizar,
  };
}
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
  recuperarSincronizacionesInterrumpidas,
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

  // ==========================================
  // ACTUALIZAR CONTADOR DE PENDIENTES
  // ==========================================

  const actualizarPendientes =
    useCallback(async () => {
      try {
        const encuestas =
          await obtenerEncuestasPendientes();

        setPendientes(encuestas.length);

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

  // ==========================================
  // DETECTAR CAMBIOS DE CONECTIVIDAD
  // ==========================================

  useEffect(() => {
    const manejarOnline = () => {
      setOnline(true);
      void actualizarPendientes();
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

  // ==========================================
  // RECUPERAR SINCRONIZACIONES INTERRUMPIDAS
  // ==========================================

  useEffect(() => {
    let cancelado = false;

    const cargarPendientesInicialmente =
      async () => {
        try {
          await recuperarSincronizacionesInterrumpidas();

          const encuestas =
            await obtenerEncuestasPendientes();

          if (cancelado) {
            return;
          }

          setPendientes(encuestas.length);
          setErrorSincronizacion('');

        } catch (error) {
          if (cancelado) {
            return;
          }

          console.error(
            'Error recuperando encuestas pendientes:',
            error
          );

          setErrorSincronizacion(
            'No fue posible recuperar las encuestas pendientes.'
          );
        }
      };

    void cargarPendientesInicialmente();

    return () => {
      cancelado = true;
    };
  }, []);

  // ==========================================
  // SINCRONIZAR ENCUESTAS
  // ==========================================

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

        // --------------------------------------
        // 1. Obtener cuenta autenticada
        // --------------------------------------

        const account =
          instance.getActiveAccount() ||
          instance.getAllAccounts()[0];

        if (!account) {
          throw new Error(
            'No existe una cuenta autenticada. Inicia sesión con Microsoft.'
          );
        }

        instance.setActiveAccount(account);

        // --------------------------------------
        // 2. Obtener Access Token
        // --------------------------------------

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
            'No fue posible obtener el token de acceso.'
          );
        }

        // --------------------------------------
        // 3. Consultar encuestas pendientes
        // --------------------------------------

        const encuestas =
          await obtenerEncuestasPendientes();

        setPendientes(encuestas.length);

        if (encuestas.length === 0) {
          setErrorSincronizacion('');
          return;
        }

        let exitosas = 0;
        let fallidas = 0;

        // --------------------------------------
        // 4. Enviar cada encuesta
        // --------------------------------------

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
                `No fue posible recuperar la encuesta local ${encuesta.id}.`
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

            const resultado =
              await enviarEncuesta(
                accessToken,
                payload
              );

            console.log(
              'Respuesta de SATISDATA API:',
              resultado
            );

            // ----------------------------------
            // 5. Validar la respuesta del servidor
            // ----------------------------------

            if (!resultado?.ok) {
              throw new Error(
                resultado?.mensaje ||
                  'La API no confirmó la recepción de la encuesta.'
              );
            }

            if (resultado.persistida !== true) {
              throw new Error(
                'La API no confirmó el almacenamiento permanente de la encuesta.'
              );
            }

            // ----------------------------------
            // 6. Marcar como sincronizada
            // Solo después de la confirmación
            // ----------------------------------

            await marcarComoSincronizada(
              encuesta.id
            );

            exitosas += 1;

          } catch (error) {
            console.error(
              `Error sincronizando encuesta ${encuesta.id}:`,
              error
            );

            await marcarComoError(
              encuesta.id,
              error.message ||
                'Error desconocido durante la sincronización.'
            );

            fallidas += 1;
          }
        }

        // --------------------------------------
        // 7. Actualizar el contador final
        // --------------------------------------

        await actualizarPendientes();

        if (fallidas > 0) {
          setErrorSincronizacion(
            `Sincronización finalizada: ${exitosas} correcta(s) y ${fallidas} fallida(s). Las fallidas permanecen disponibles para reintentar.`
          );
        } else {
          setErrorSincronizacion('');

          console.log(
            `Sincronización completada: ${exitosas} encuesta(s).`
          );
        }

      } catch (error) {
        console.error(
          'Error durante la sincronización:',
          error
        );

        setErrorSincronizacion(
          error.message ||
            'No fue posible completar la sincronización.'
        );

        // Refrescar el contador sin ocultar
        // las encuestas que siguen pendientes.
        await actualizarPendientes();

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

  // ==========================================
  // ESTADO PÚBLICO DEL HOOK
  // ==========================================

  return {
    online,
    pendientes,
    sincronizando,
    errorSincronizacion,
    actualizarPendientes,
    sincronizar,
  };
}
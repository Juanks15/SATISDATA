import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  obtenerEncuestasPendientes,
  obtenerEncuestaParaSincronizar,
  construirPayloadEncuesta,
} from '../services/sincronizacion';

export function useSincronizacion() {
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
    actualizarPendientes();
  }, [actualizarPendientes]);

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

        const encuestas =
          await obtenerEncuestasPendientes();

        for (const encuesta of encuestas) {
          try {
            const datos =
              await obtenerEncuestaParaSincronizar(
                encuesta.id
              );

            if (!datos) {
              continue;
            }

            const payload =
              construirPayloadEncuesta(
                datos.encuesta,
                datos.respuestas
              );

            console.log(
              'Payload preparado para sincronización:',
              payload
            );

          } catch (error) {
            console.error(
              `Error preparando encuesta ${encuesta.id}:`,
              error
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
          'No fue posible completar la sincronización.'
        );
      } finally {
        setSincronizando(false);
      }
    },
    [
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
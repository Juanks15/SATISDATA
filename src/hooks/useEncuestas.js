import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  crearEncuesta,
  eliminarEncuesta,
  obtenerEncuestaPorId,
  obtenerEncuestas,
} from '../services/encuestas';

export function useEncuestas() {
  const [
    encuestas,
    setEncuestas,
  ] = useState([]);

  const [
    cargandoEncuestas,
    setCargandoEncuestas,
  ] = useState(false);

  const [
    errorEncuestas,
    setErrorEncuestas,
  ] = useState('');

  const cargarEncuestas = useCallback(
    async () => {
      try {
        setCargandoEncuestas(true);
        setErrorEncuestas('');

        const datos =
          await obtenerEncuestas();

        setEncuestas(datos);

        return datos;
      } catch (error) {
        console.error(
          'Error cargando encuestas:',
          error
        );

        setErrorEncuestas(
          'No fue posible cargar las encuestas.'
        );

        return [];
      } finally {
        setCargandoEncuestas(false);
      }
    },
    []
  );

  const guardarEncuesta =
    useCallback(
      async ({
        encuesta,
        respuestas,
      }) => {
        try {
          setErrorEncuestas('');

          const id =
            await crearEncuesta({
              encuesta,
              respuestas,
            });

          await cargarEncuestas();

          return id;
        } catch (error) {
          console.error(
            'Error guardando encuesta:',
            error
          );

          setErrorEncuestas(
            'No fue posible guardar la encuesta.'
          );

          throw error;
        }
      },
      [cargarEncuestas]
    );

  const obtenerEncuesta =
    useCallback(
      async (encuestaId) => {
        try {
          setErrorEncuestas('');

          return await obtenerEncuestaPorId(
            encuestaId
          );
        } catch (error) {
          console.error(
            'Error obteniendo encuesta:',
            error
          );

          setErrorEncuestas(
            'No fue posible consultar la encuesta.'
          );

          throw error;
        }
      },
      []
    );

  const eliminar =
    useCallback(
      async (encuestaId) => {
        try {
          setErrorEncuestas('');

          await eliminarEncuesta(
            encuestaId
          );

          await cargarEncuestas();
        } catch (error) {
          console.error(
            'Error eliminando encuesta:',
            error
          );

          setErrorEncuestas(
            'No fue posible eliminar la encuesta.'
          );

          throw error;
        }
      },
      [cargarEncuestas]
    );

  useEffect(() => {
    cargarEncuestas();
  }, [cargarEncuestas]);

  return {
    encuestas,
    cargandoEncuestas,
    errorEncuestas,
    cargarEncuestas,
    guardarEncuesta,
    obtenerEncuesta,
    eliminarEncuesta: eliminar,
  };
}

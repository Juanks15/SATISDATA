import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  actualizarBorrador,
  crearBorrador,
  eliminarBorrador,
  obtenerBorradorActivo,
} from '../services/borradores';

const TIEMPO_AUTOGUARDADO = 400;

export function useBorradorEncuesta({
  formulario,
  respuestas,
  vista,
}) {
  const [borradorId, setBorradorId] =
    useState(null);

  const [
    borradorEncontrado,
    setBorradorEncontrado,
  ] = useState(null);

  const [
    mostrarBorrador,
    setMostrarBorrador,
  ] = useState(false);

  const [
    guardandoBorrador,
    setGuardandoBorrador,
  ] = useState(false);

  const [
    errorBorrador,
    setErrorBorrador,
  ] = useState('');

  /**
   * Busca si existe una encuesta que quedó
   * pendiente de completar.
   */
  const buscarBorradorActivo = useCallback(
    async () => {
      try {
        setErrorBorrador('');

        const borrador =
          await obtenerBorradorActivo();

        if (!borrador) {
          return null;
        }

        setBorradorEncontrado(borrador);
        setMostrarBorrador(true);

        return borrador;
      } catch (error) {
        console.error(
          'Error buscando borrador activo:',
          error
        );

        setErrorBorrador(
          'No fue posible consultar la encuesta en progreso.'
        );

        return null;
      }
    },
    []
  );

  /**
   * Inicia una encuesta.
   *
   * Si existe un borrador activo, no crea otro:
   * primero solicita al usuario continuar o descartarlo.
   */
  const iniciarBorrador = useCallback(
    async () => {
      try {
        setErrorBorrador('');

        const borradorActivo =
          await obtenerBorradorActivo();

        if (borradorActivo) {
          setBorradorEncontrado(
            borradorActivo
          );

          setMostrarBorrador(true);

          return {
            tipo: 'existente',
            borrador: borradorActivo,
          };
        }

        const nuevoBorrador =
          await crearBorrador();

        setBorradorId(
          nuevoBorrador.id
        );

        return {
          tipo: 'nuevo',
          borrador: nuevoBorrador,
        };
      } catch (error) {
        console.error(
          'Error iniciando borrador:',
          error
        );

        setErrorBorrador(
          'No fue posible iniciar la encuesta.'
        );

        throw error;
      }
    },
    []
  );

  /**
   * Activa el borrador seleccionado.
   */
  const activarBorrador = useCallback(
    (borrador) => {
      if (!borrador) {
        return;
      }

      setBorradorId(borrador.id);

      setMostrarBorrador(false);
      setBorradorEncontrado(null);
      setErrorBorrador('');
    },
    []
  );

  /**
   * Guarda manualmente el estado actual del borrador.
   */
  const guardarBorrador = useCallback(
    async () => {
      if (!borradorId) {
        return;
      }

      try {
        setGuardandoBorrador(true);
        setErrorBorrador('');

        await actualizarBorrador(
          borradorId,
          formulario,
          respuestas
        );
      } catch (error) {
        console.error(
          'Error guardando borrador:',
          error
        );

        setErrorBorrador(
          'No fue posible guardar los cambios localmente.'
        );
      } finally {
        setGuardandoBorrador(false);
      }
    },
    [
      borradorId,
      formulario,
      respuestas,
    ]
  );

  /**
   * Autoguardado con debounce.
   *
   * Cada modificación espera unos milisegundos
   * antes de persistirse para evitar escribir en
   * IndexedDB en cada pulsación.
   */
  useEffect(() => {
    if (
      vista !== 'encuesta' ||
      !borradorId
    ) {
      return undefined;
    }

    const temporizador =
      setTimeout(() => {
        guardarBorrador();
      }, TIEMPO_AUTOGUARDADO);

    return () => {
      clearTimeout(temporizador);
    };
  }, [
    formulario,
    respuestas,
    borradorId,
    vista,
    guardarBorrador,
  ]);

  /**
   * Descarta definitivamente el borrador.
   */
  const descartarBorrador = useCallback(
    async (id = null) => {
      const idEliminar =
        id ?? borradorEncontrado?.id;

      if (!idEliminar) {
        return;
      }

      try {
        setErrorBorrador('');

        await eliminarBorrador(
          idEliminar
        );

        if (
          idEliminar === borradorId
        ) {
          setBorradorId(null);
        }

        setBorradorEncontrado(null);
        setMostrarBorrador(false);
      } catch (error) {
        console.error(
          'Error descartando borrador:',
          error
        );

        setErrorBorrador(
          'No fue posible descartar el borrador.'
        );

        throw error;
      }
    },
    [
      borradorEncontrado,
      borradorId,
    ]
  );

  /**
   * Finaliza el ciclo del borrador.
   *
   * La encuesta definitiva ya debe haber sido
   * almacenada antes de eliminar el borrador.
   */
  const finalizarBorrador =
    useCallback(async () => {
      if (!borradorId) {
        return;
      }

      try {
        await eliminarBorrador(
          borradorId
        );

        setBorradorId(null);
        setBorradorEncontrado(null);
        setMostrarBorrador(false);
        setErrorBorrador('');
      } catch (error) {
        console.error(
          'Error finalizando borrador:',
          error
        );

        throw error;
      }
    }, [borradorId]);

  /**
   * Limpia completamente el estado React
   * relacionado con el borrador.
   */
  const limpiarEstadoBorrador =
    useCallback(() => {
      setBorradorId(null);
      setBorradorEncontrado(null);
      setMostrarBorrador(false);
      setGuardandoBorrador(false);
      setErrorBorrador('');
    }, []);

  return {
    borradorId,
    borradorEncontrado,
    mostrarBorrador,
    guardandoBorrador,
    errorBorrador,

    buscarBorradorActivo,
    iniciarBorrador,
    activarBorrador,
    guardarBorrador,
    descartarBorrador,
    finalizarBorrador,
    limpiarEstadoBorrador,
  };
}
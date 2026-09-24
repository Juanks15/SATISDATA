import { useState } from 'react';

function PanelFuncionario({
  encuestasPendientes,
  encuestasRegistradas,
  online,
  sincronizando,
  errorSincronizacion,
  onCerrarSesion,
  onSincronizar,
  onBuscar,
  onVerHistoricos,
}) {
  const [busqueda, setBusqueda] = useState('');

  const handleBuscar = (event) => {
    event.preventDefault();

    const termino = busqueda.trim();

    if (onBuscar) {
      onBuscar(termino);
    }
  };

  return (
    <section className="employee-dashboard">

      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="employee-dashboard-header">

        <div className="employee-heading">

          <button
            type="button"
            className="employee-back-button"
            onClick={onCerrarSesion}
          >
            <span className="employee-back-icon">←</span>
            Volver
          </button>

          <div className="employee-title-row">
            <div className="employee-title-icon">
              S
            </div>

            <div>
              <span className="employee-eyebrow">
                PANEL DEL FUNCIONARIO
              </span>

              <h2>
                Gestión de encuestas
              </h2>
            </div>
          </div>

          <p className="employee-header-description">
            Consulte, registre y gestione las encuestas
            almacenadas en este dispositivo.
          </p>

        </div>

        <div className="employee-device-status">

          <span className="employee-device-status-dot"></span>

          <div>
            <span className="employee-device-status-label">
              Estado del dispositivo
            </span>

            <strong>
              {online
    ? 'Conexión disponible'
    : 'Sin conexión a Internet'}
            </strong>
          </div>

        </div>

      </div>

      {/* ==================================================
          RESUMEN
      ================================================== */}

      <section className="employee-overview">

        <div className="employee-welcome-card">

          <span className="employee-card-kicker">
            SESIÓN ACTUAL
          </span>

          <div className="employee-welcome-content">

            <div className="employee-avatar">
              F
            </div>

            <div>
              <h3>
                Funcionario de prueba
              </h3>

              <p>
                funcionario@institucion.gov.co
              </p>

              <span className="employee-role-badge">
                Funcionario
              </span>
            </div>

          </div>

        </div>

        <div className="employee-stat-card">

          <div className="employee-stat-header">
            <span className="employee-card-kicker">
              REGISTRADAS
            </span>

            <span className="employee-stat-icon employee-stat-icon-primary">
              ✓
            </span>
          </div>

          <strong>
            {encuestasRegistradas}
          </strong>

          <span className="employee-stat-description">
            Encuestas almacenadas
            en el dispositivo
          </span>

        </div>

        <div className="employee-stat-card employee-stat-card-warning">

          <div className="employee-stat-header">
            <span className="employee-card-kicker">
              PENDIENTES
            </span>

            <span className="employee-stat-icon employee-stat-icon-warning">
              ↑
            </span>
          </div>

          <strong>
            {encuestasPendientes}
          </strong>

          <span className="employee-stat-description">
            Encuestas pendientes
            de sincronización
          </span>

        </div>

      </section>

      {/* ==================================================
          SINCRONIZACIÓN
      ================================================== */}

      <section className="employee-sync-panel">

        <div className="employee-sync-symbol">
          ↑
        </div>

        <div className="employee-sync-main">

          <div className="employee-sync-heading">
            <span className="employee-card-kicker">
              SINCRONIZACIÓN
            </span>

            <span
              className={
                encuestasPendientes > 0
                  ? 'employee-sync-badge employee-sync-badge-pending'
                  : 'employee-sync-badge employee-sync-badge-ready'
              }
            >
              {encuestasPendientes > 0
                ? `${encuestasPendientes} pendientes`
                : 'Todo al día'}
            </span>
          </div>

          <h3>
            {encuestasPendientes > 0
              ? 'Hay encuestas pendientes de envío'
              : 'No hay encuestas pendientes'}
          </h3>

          <p>
            {encuestasPendientes > 0
              ? 'Los registros permanecen almacenados localmente hasta que se pueda realizar la sincronización.'
              : 'Las encuestas registradas actualmente no requieren sincronización.'}
          </p>

        </div>

        <button
          type="button"
  className="employee-sync-button"
  onClick={onSincronizar}
  disabled={
    !online ||
    encuestasPendientes === 0 ||
    sincronizando
  }
>
  {sincronizando
    ? 'Preparando sincronización...'
    : !online
      ? 'Sin conexión'
      : encuestasPendientes > 0
        ? 'Sincronizar ahora'
        : 'Sin pendientes'}

        </button>
        {errorSincronizacion && (
  <div className="employee-sync-error">
    {errorSincronizacion}
  </div>
)}

      </section>

      {/* ==================================================
          ACCIONES PRINCIPALES
      ================================================== */}

      <div className="employee-section-heading">

        <div>
          <span className="employee-card-kicker">
            HERRAMIENTAS
          </span>

          <h3>
            Acciones disponibles
          </h3>
        </div>

        <span>
          Gestión local
        </span>

      </div>

      <section className="employee-actions-grid">

        {/* HISTÓRICOS */}

        <button
          type="button"
          className="employee-action-card"
          onClick={onVerHistoricos}
        >

          <div className="employee-action-top">
            <span className="employee-action-icon">
              ≡
            </span>

            <span className="employee-action-arrow">
              →
            </span>
          </div>

          <span className="employee-card-kicker">
            CONSULTA
          </span>

          <h3>
            Históricos de encuestas
          </h3>

          <p>
            Consulte los registros guardados,
            revise su información y acceda
            al detalle de cada encuesta.
          </p>

          <span className="employee-action-link">
            Abrir históricos
            <span>→</span>
          </span>

        </button>

        {/* BÚSQUEDA */}

        <div className="employee-search-card">

          <div className="employee-action-top">
            <span className="employee-action-icon">
              ⌕
            </span>
          </div>

          <span className="employee-card-kicker">
            BÚSQUEDA LOCAL
          </span>

          <h3>
            Buscar una encuesta
          </h3>

          <p>
            Localice registros por código,
            departamento o municipio.
          </p>

          <form
            className="employee-search-form"
            onSubmit={handleBuscar}
          >

            <div className="employee-search-field">
              <input
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Código, departamento o municipio..."
                aria-label="Buscar encuesta"
              />
            </div>

            <button
              type="submit"
              className="employee-search-button"
            >
              Buscar
            </button>

          </form>

        </div>

      </section>

      {/* ==================================================
          SEGURIDAD / OFFLINE
      ================================================== */}

      <section className="employee-offline-card">

        <div className="employee-offline-icon">
          ✓
        </div>

        <div className="employee-offline-content">

          <span className="employee-card-kicker">
            FUNCIONAMIENTO OFFLINE
          </span>

          <h3>
            Los datos permanecen en el dispositivo
          </h3>

          <p>
            SATISDATA puede continuar funcionando
            sin conexión a Internet. Las encuestas
            permanecerán almacenadas localmente
            hasta su posterior sincronización.
          </p>

        </div>

        <div className="employee-offline-indicator">
          <span></span>
          Disponible
        </div>

      </section>

      {/* ==================================================
          SESIÓN
      ================================================== */}

      <section className="employee-session-footer">

        <div>
          <span className="employee-card-kicker">
            SESIÓN
          </span>

          <strong>
            Funcionario de prueba
          </strong>
        </div>

        <button
          type="button"
          className="employee-logout-button"
          onClick={onCerrarSesion}
        >
          Cerrar sesión
        </button>

      </section>

    </section>
  );
}

export default PanelFuncionario;
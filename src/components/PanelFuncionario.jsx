import { useState } from 'react';

function PanelFuncionario({
  encuestasPendientes,
  encuestasRegistradas,
  onCerrarSesion,
  onSincronizar,
  onBuscar,
  onVerHistoricos,
}) {
  const [busqueda, setBusqueda] = useState('');

  const handleBuscar = (event) => {
    event.preventDefault();

    if (onBuscar) {
      onBuscar(busqueda);
    }
  };

  return (
    <section className="employee-panel">

      {/* ENCABEZADO */}
      <div className="employee-panel-header">

        <div>
          <span className="welcome-label">
            ÁREA DEL FUNCIONARIO
          </span>

          <h2>
            Panel de gestión
          </h2>

          <p>
            Administre sus encuestas, consulte históricos y
            sincronice la información almacenada en el dispositivo.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={onCerrarSesion}
        >
          Cerrar sesión
        </button>

      </div>

      {/* INFORMACIÓN DEL FUNCIONARIO */}
      <div className="employee-profile">

        <div className="employee-avatar">
          F
        </div>

        <div className="employee-profile-info">

          <span className="card-label">
            FUNCIONARIO AUTENTICADO
          </span>

          <strong>
            Funcionario de prueba
          </strong>

          <span>
            funcionario@institucion.gov.co
          </span>

        </div>

        <div className="employee-role">
          Funcionario
        </div>

      </div>

      {/* RESUMEN */}
      <div className="employee-stats">

        <div className="employee-stat-card">

          <span className="card-label">
            PENDIENTES
          </span>

          <strong>
            {encuestasPendientes}
          </strong>

          <p>
            Encuestas almacenadas localmente
            esperando sincronización.
          </p>

        </div>

        <div className="employee-stat-card">

          <span className="card-label">
            REGISTRADAS
          </span>

          <strong>
            {encuestasRegistradas}
          </strong>

          <p>
            Encuestas actualmente disponibles
            en el dispositivo.
          </p>

        </div>

        <div className="employee-stat-card">

          <span className="card-label">
            ESTADO
          </span>

          <strong className="employee-online">
            Offline
          </strong>

          <p>
            Los datos pueden continuar
            registrándose sin conexión.
          </p>

        </div>

      </div>

      {/* SINCRONIZACIÓN */}
      <div className="employee-sync-card">

        <div className="employee-sync-icon">
          ↑
        </div>

        <div className="employee-sync-info">

          <span className="card-label">
            SINCRONIZACIÓN
          </span>

          <h3>
            Encuestas pendientes de envío
          </h3>

          <p>
            Cuando exista conexión a Internet y la sesión
            institucional esté disponible, las encuestas
            almacenadas podrán enviarse al servidor.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={onSincronizar}
          disabled={encuestasPendientes === 0}
        >
          Sincronizar
        </button>

      </div>

      {/* BÚSQUEDA */}
      <div className="employee-search-card">

        <div className="employee-search-header">

          <div>
            <span className="card-label">
              CONSULTA
            </span>

            <h3>
              Buscar encuestas
            </h3>
          </div>

          <span>
            Búsqueda local
          </span>

        </div>

        <form
          className="employee-search-form"
          onSubmit={handleBuscar}
        >

          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por código, municipio o departamento..."
          />

          <button
            type="submit"
            className="primary-button"
          >
            Buscar
          </button>

        </form>

      </div>

      {/* HISTÓRICOS */}
      <div className="employee-history-card">

        <div>
          <span className="card-label">
            INFORMACIÓN
          </span>

          <h3>
            Históricos de encuestas
          </h3>

          <p>
            Consulte las encuestas registradas anteriormente
            desde este dispositivo.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={onVerHistoricos}
        >
          Ver históricos
        </button>

      </div>

    </section>
  );
}

export default PanelFuncionario;
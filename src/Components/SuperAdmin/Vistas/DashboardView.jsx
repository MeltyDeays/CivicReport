import { useEntidadesSuperAdmin } from "../Controladores/useEntidadesSuperAdmin";

export default function SuperAdminDashboardView() {
  const { entidades, error } = useEntidadesSuperAdmin();

  return (
    <section>
      <header className="view-header">
        <div>
          <h1>Panel Super Admin</h1>
          <p>Gestiona entidades, catálogos y configuraciones globales.</p>
        </div>
      </header>

      {error ? <p className="warn-text">No se pudieron cargar las entidades ({error}).</p> : null}

      <div className="list-stack">
        {entidades.length ? (
          entidades.map((entidad) => (
            <article key={entidad.id} className="list-card">
              <div>
                <h3>{entidad.nombre}</h3>
                <p>
                  {entidad.categoria} - {entidad.sector || "Sin sector"}
                </p>
                <small>{entidad.email_contacto || "Sin correo de contacto"}</small>
              </div>
              <div className="status-line">
                <span className="chip">{entidad.esta_usado ? "Activa" : "Disponible"}</span>
                <span className="chip">{entidad.codigo_invitacion}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <h3>Sin entidades registradas</h3>
            <p>Aqui aparecerán ENACAL, Alcaldías y demás entidades administrativas.</p>
          </div>
        )}
      </div>
    </section>
  );
}


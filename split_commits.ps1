$ErrorActionPreference = "Stop"

# Guardar config original
$originalName = "MeltyDeays"
$originalEmail = "everdavicloez123@gmail.com"

Write-Host "Cambiando identidad a Derling..."
git config user.name "Derling Dariel Cruz Ruiz"
git config user.email "derlingcruz2@gmail.com"

git add package.json package-lock.json vite.config.js index.html
git commit -m "chore: configuracion de dependencias y Vite"

git add src/core/ src/utils/ src/data/
git commit -m "feat: utilidades core y constantes geograficas"

git rm -q --cached src/App.css src/supabase.js 2>$null
git add src/App.jsx src/index.css src/Components/AppLayout.jsx
git commit -m "feat: enrutamiento principal y estilos globales"

git rm -q --cached src/Components/Login.jsx src/Components/Ciudadanos/RegistroCiudadano.jsx 2>$null
git add src/modules/
git commit -m "feat: modulo de autenticacion integrado"


Write-Host "Cambiando identidad a Ileana..."
git config user.name "ileanacabrera"
git config user.email "139278429+ileanacabrera@users.noreply.github.com"

git add src/services/
git commit -m "feat: servicios de conexion a Supabase y Storage"

git add src/Components/Ciudadanos/Modelos/ src/Components/Ciudadanos/Controladores/
git commit -m "feat: logica y modelos para el panel ciudadano"

git add src/Components/Ciudadanos/Vistas/ src/views/
git commit -m "feat: vistas interactivas del panel ciudadano"

git add src/modals/ReportFormModal.jsx
git commit -m "feat: modal de creacion de reportes con GPS"


Write-Host "Cambiando identidad a Ever (MeltyDeays)..."
git config user.name $originalName
git config user.email $originalEmail

git add src/Components/AdminEntidad/Modelos/ src/Components/AdminEntidad/Controladores/
git commit -m "feat: controladores avanzados y logica core de admin entidad"

git add src/Components/AdminEntidad/Vistas/ src/modals/
git commit -m "feat: vistas de gestion, ordenes de reparacion, heatmap interactivo y kanban"

git rm -q --cached src/Components/SuperAdmin/RegistrarEntidad.jsx src/Components/SuperAdmin/SuperAdminPanel.jsx 2>$null
git add src/Components/SuperAdmin/
git commit -m "feat: arquitectura completa del panel SuperAdmin"

git add src/Components/Tecnico/ .gitignore .trae/ skills-lock.json split_commits.ps1
git commit -m "feat: logica operativa de tecnicos y scripts de mantenimiento"

Write-Host "Commit final de limpieza (si queda algo)..."
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "chore: integracion final y resolucion de dependencias de modulos"
}

Write-Host "Restaurando identidad original..."
git config user.name $originalName
git config user.email $originalEmail

Write-Host "¡Nuevos commits con identidad PERFECTA creados exitosamente!"

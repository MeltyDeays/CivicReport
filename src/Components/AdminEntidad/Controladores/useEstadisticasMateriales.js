import { useCallback, useEffect, useMemo, useState } from "react";
import { estadisticasAdminEntidadModel } from "../Modelos/estadisticasModel";

function keyFor(row) {
  const materialId = row.material_id;
  const prioridad = row.prioridad_denuncia || "sin_prioridad";
  const categoria = row.categoria_denuncia || "sin_categoria";
  return `${materialId}::${prioridad}::${categoria}`;
}

export function useEstadisticasMateriales(entidadId) {
  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    if (!entidadId) return;
    setCargando(true);
    setError("");
    try {
      const res = await estadisticasAdminEntidadModel.listarUsoMateriales(entidadId);
      if (res.error) throw new Error(res.error.message);
      setRows(res.data || []);
    } catch (e) {
      setError(e.message || "No se pudieron cargar estadisticas");
    } finally {
      setCargando(false);
    }
  }, [entidadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const resumen = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      const k = keyFor(row);
      const prev = map.get(k) || {
        material_id: row.material_id,
        material_nombre: row.materiales?.nombre || "Material",
        unidad_medida: row.materiales?.unidad_medida || "unidad",
        prioridad: row.prioridad_denuncia || "sin_prioridad",
        categoria: row.categoria_denuncia || "sin_categoria",
        total: 0,
        muestras: 0,
      };
      prev.total += Number(row.cantidad_usada || 0);
      prev.muestras += 1;
      map.set(k, prev);
    }

    return Array.from(map.values())
      .map((it) => ({ ...it, promedio: it.muestras ? Math.round((it.total / it.muestras) * 100) / 100 : 0 }))
      .sort((a, b) => b.muestras - a.muestras);
  }, [rows]);

  return { rows, resumen, cargando, error, recargar };
}


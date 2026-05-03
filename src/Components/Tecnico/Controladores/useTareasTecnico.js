import { useCallback, useEffect, useMemo, useState } from "react";
import { tareasTecnicoModel } from "../Modelos/tareasModel";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";

const COLUMNAS = [
  { id: 0, key: "pendiente", title: "Pendiente" },
  { id: 1, key: "en_reparacion", title: "En Reparación" },
  { id: 2, key: "completado", title: "Completado" },
];

/**
 * ViewModel del Técnico — H026
 * Custom Hook que gestiona tareas asignadas y cambio de estados.
 */
export function useTareasTecnico() {
  const { perfil } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    if (!perfil?.id) return;
    setCargando(true);
    setError("");
    try {
      const res = await tareasTecnicoModel.listarAsignadas(perfil.id);
      if (res.error) throw new Error(res.error.message);
      setTareas(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [perfil?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const agrupado = useMemo(() => {
    return COLUMNAS.map((col) => ({
      ...col,
      items: tareas.filter((t) => t.estado === col.key),
    }));
  }, [tareas]);

  const cambiarEstado = useCallback(async (denunciaId, nuevoEstado) => {
    await tareasTecnicoModel.cambiarEstado(denunciaId, nuevoEstado);
    setTareas((prev) =>
      prev.map((t) => t.id === denunciaId ? { ...t, estado: nuevoEstado } : t)
    );
  }, []);

  return { tareas, agrupado, cargando, error, cargar, cambiarEstado, COLUMNAS };
}

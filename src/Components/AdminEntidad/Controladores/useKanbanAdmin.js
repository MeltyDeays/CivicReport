import { useCallback, useEffect, useMemo, useState } from "react";
import {
  obtenerTareasKanban,
  moverTarea,
  quitarDelTablero,
} from "../../../services/kanbanService";
import { DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";

const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;

export function useKanbanAdmin() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [idMoviendo, setIdMoviendo] = useState("");
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // Filtros Tablero Principal
  const [filtroDept, setFiltroDept] = useState("Todos");
  const [filtroCity, setFiltroCity] = useState("Todos");

  // Filtros Historial Modal
  const [histFiltroDept, setHistFiltroDept] = useState("Todos");
  const [histFiltroCity, setHistFiltroCity] = useState("Todos");
  const [histFiltroPrio, setHistFiltroPrio] = useState("todas");
  const [histBusqueda, setHistBusqueda] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await obtenerTareasKanban();
    setTareas(res.data || []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Ciudades disponibles según departamento seleccionado (Tablero)
  const ciudadesDisponibles = useMemo(() => {
    if (filtroDept === "Todos") return [];
    return DEPARTAMENTOS_NICARAGUA[filtroDept]?.municipios || [];
  }, [filtroDept]);

  const cambiarDepartamento = useCallback((dept) => {
    setFiltroDept(dept);
    setFiltroCity("Todos");
  }, []);

  // Ciudades disponibles según departamento seleccionado (Historial)
  const histCiudadesDisponibles = useMemo(() => {
    if (histFiltroDept === "Todos") return [];
    return DEPARTAMENTOS_NICARAGUA[histFiltroDept]?.municipios || [];
  }, [histFiltroDept]);

  const cambiarHistDepartamento = useCallback((dept) => {
    setHistFiltroDept(dept);
    setHistFiltroCity("Todos");
  }, []);

  // Separar tareas activas (< 8h completadas) y historial (> 8h completadas)
  const { tareasActivas, historial } = useMemo(() => {
    const ahora = Date.now();
    const activas = [];
    const hist = [];
    
    const termino = histBusqueda.toLowerCase();

    tareas.forEach((t) => {
      let esHistorial = false;
      if (t.indice_columna === 2 && t.fecha_fin) {
        const completadaHace = ahora - new Date(t.fecha_fin).getTime();
        if (completadaHace > OCHO_HORAS_MS) {
          esHistorial = true;
        }
      }

      if (esHistorial) {
        // Filtros específicos del historial
        if (histFiltroDept !== "Todos" && t.departamento !== histFiltroDept) return;
        if (histFiltroCity !== "Todos" && t.municipio !== histFiltroCity) return;
        if (histFiltroPrio !== "todas" && t.prioridad !== histFiltroPrio) return;
        if (termino && !t.titulo.toLowerCase().includes(termino) && !(t.descripcion && t.descripcion.toLowerCase().includes(termino))) return;
        
        hist.push(t);
      } else {
        // Filtros del tablero principal
        if (filtroDept !== "Todos" && t.departamento !== filtroDept) return;
        if (filtroCity !== "Todos" && t.municipio !== filtroCity) return;
        
        activas.push(t);
      }
    });

    // Historial: más recientes primero
    hist.sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin));

    return { tareasActivas: activas, historial: hist };
  }, [tareas, filtroDept, filtroCity, histFiltroDept, histFiltroCity, histFiltroPrio, histBusqueda]);

  const manejarMover = useCallback(async (idDenuncia, indiceColumna) => {
    setIdMoviendo(idDenuncia);
    try {
      await moverTarea(idDenuncia, indiceColumna);
      setTareas((prev) =>
        prev.map((t) =>
          t.id === idDenuncia
            ? {
                ...t,
                indice_columna: indiceColumna,
                fecha_fin: indiceColumna === 2 ? new Date().toISOString() : null,
              }
            : t
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIdMoviendo("");
    }
  }, []);

  const manejarQuitar = useCallback(async (idDenuncia) => {
    setIdMoviendo(idDenuncia);
    try {
      await quitarDelTablero(idDenuncia);
      setTareas((prev) => prev.filter((t) => t.id !== idDenuncia));
    } catch (e) {
      console.error(e);
    } finally {
      setIdMoviendo("");
    }
  }, []);

  return {
    cargando,
    tareasActivas,
    historial,
    idMoviendo,
    mostrarHistorial,
    setMostrarHistorial,
    filtroDept,
    filtroCity,
    ciudadesDisponibles,
    cambiarDepartamento,
    setFiltroCity,
    histFiltroDept,
    histFiltroCity,
    histFiltroPrio,
    histBusqueda,
    histCiudadesDisponibles,
    cambiarHistDepartamento,
    setHistFiltroCity,
    setHistFiltroPrio,
    setHistBusqueda,
    manejarMover,
    manejarQuitar,
    cargar,
  };
}

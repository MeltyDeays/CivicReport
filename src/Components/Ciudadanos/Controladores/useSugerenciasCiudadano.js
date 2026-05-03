import { useCallback, useEffect, useState } from "react";
import { sugerenciasCiudadanoModel } from "../Modelos/sugerenciasModel";

export function useSugerenciasCiudadano() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ source: "supabase", error: null });

  const cargarSugerencias = useCallback(async () => {
    const result = await sugerenciasCiudadanoModel.listar();
    setItems(result.data || []);
    setMeta({ source: result.source, error: result.error });
  }, []);

  useEffect(() => {
    cargarSugerencias();
  }, [cargarSugerencias]);

  const crear = useCallback(async (payload) => {
    const creada = await sugerenciasCiudadanoModel.crear(payload);
    setItems((prev) => [creada, ...prev]);
    return creada;
  }, []);

  return { items, meta, cargarSugerencias, crear };
}


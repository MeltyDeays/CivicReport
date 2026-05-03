import { useCallback, useEffect, useState } from "react";
import { entidadesSuperAdminModel } from "../Modelos/entidadesModel";

export function useEntidadesSuperAdmin() {
  const [entidades, setEntidades] = useState([]);
  const [error, setError] = useState(null);

  const cargarEntidades = useCallback(async () => {
    const { data, error: requestError } = await entidadesSuperAdminModel.listar();
    if (requestError) {
      setError(requestError.message);
      setEntidades([]);
      return;
    }
    setError(null);
    setEntidades(data || []);
  }, []);

  useEffect(() => {
    cargarEntidades();
  }, [cargarEntidades]);

  return { entidades, error, cargarEntidades };
}


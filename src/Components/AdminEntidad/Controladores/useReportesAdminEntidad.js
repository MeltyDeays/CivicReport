import { useCallback, useEffect, useState } from "react";
import { adminEntidadReportesModel } from "../Modelos/reportesModel";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";

export function useReportesAdminEntidad() {
  const { perfil } = useAuth();
  const [items, setItems] = useState([]);

  const cargar = useCallback(async () => {
    const result = await adminEntidadReportesModel.listar(perfil?.id_entidad);
    setItems(result.data || []);
  }, [perfil?.id_entidad]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { items, setItems, cargar };
}


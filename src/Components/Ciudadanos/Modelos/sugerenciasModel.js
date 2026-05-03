import { crearSugerencia, obtenerSugerencias } from "../../../services/suggestionService";

export const sugerenciasCiudadanoModel = {
  listar: obtenerSugerencias,
  crear: crearSugerencia,
};


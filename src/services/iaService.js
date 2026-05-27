// Archivo: src/services/iaService.js
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { supabase } from "../core/supabaseClient";

// Verificar si existe la llave API de Groq para usar IA real, de lo contrario activamos el fallback local simulado
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

let MODELO_IA = null;
if (GROQ_API_KEY) {
  const groq = createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: GROQ_API_KEY,
  });
  MODELO_IA = groq("llama-3.3-70b-versatile");
}

/**
 * CASO DE USO 2: Filtro de Moderación Semántica y Anti-Spam
 * Compara reportes entrantes con reportes existentes geolocalizados en PostGIS
 */
export async function validarReporteAntiSpam(nuevoReporte) {
  // Ejecutar búsqueda geográfica de reportes activos a un radio de 150 metros
  const { data: cercanos, error: errCercanos } = await supabase.rpc("buscar_denuncias_por_radio", {
    lat_origen: Number(nuevoReporte.lat),
    lng_origen: Number(nuevoReporte.lng),
    radio_metros: 150.0
  });

  if (errCercanos) {
    console.error("Error al buscar denuncias por radio:", errCercanos.message);
  }

  const reportesCercanos = cercanos || [];

  if (MODELO_IA) {
    try {
      const response = await generateText({
        model: MODELO_IA,
        system: `Eres el agente de control de calidad y prevención de duplicados de CivicReport. 
        Tu objetivo es evaluar si el reporte que introduce el ciudadano ya ha sido registrado previamente basándote en la similitud semántica de su descripción y su cercanía geográfica.
        Sé conciso y directo. Si es duplicado, genera un mensaje informando educadamente al ciudadano de que su reporte ya está registrado y en revisión.`,
        prompt: `Nuevo reporte a evaluar:
        Título: "${nuevoReporte.titulo}"
        Descripción: "${nuevoReporte.descripcion}"
        
        Reportes activos cercanos ya existentes en el área (radio 150m):
        ${JSON.stringify(reportesCercanos)}`,
      });

      const esDuplicado = response.text.toLowerCase().includes("duplicado") || response.text.toLowerCase().includes("ya registrado");
      return {
        textoRespuesta: response.text,
        esDuplicado
      };
    } catch (e) {
      console.warn("Excepción al consultar modelo IA (Groq). Iniciando fallback heurístico local...", e.message);
    }
  }

  // Fallback Heurístico Local (si no hay clave Groq o falla la red)
  if (reportesCercanos.length > 0) {
    // Buscar si alguna palabra clave del título coincide con las denuncias cercanas
    const palabrasNuevas = nuevoReporte.titulo.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    for (const reporte of reportesCercanos) {
      const palabrasExistentes = reporte.titulo.toLowerCase().split(/\s+/);
      const coincidencia = palabrasNuevas.some(palabra => palabrasExistentes.includes(palabra));
      if (coincidencia) {
        return {
          textoRespuesta: `Gracias. Este problema ("${reporte.titulo}") ya fue reportado cercano a tu ubicación y se encuentra en revisión.`,
          esDuplicado: true
        };
      }
    }
  }

  return {
    textoRespuesta: "Reporte validado con éxito.",
    esDuplicado: false
  };
}

/**
 * CASO DE USO 4: Procesamiento de Lenguaje Natural para Deducción de Inventario
 * Extrae materiales y cantidades a partir del texto de resolución de una cuadrilla
 */
export async function procesarInventarioDesdeTexto(textoResolucion, entidadId) {
  // Obtener catálogo de materiales de la base de datos
  const { data: catalogo, error: errCat } = await supabase
    .from("materiales")
    .select("id, nombre, unidad_medida");

  if (errCat || !catalogo) {
    console.error("Error al obtener catálogo de materiales:", errCat?.message);
    return { resumenEjecucion: "Error al acceder al inventario." };
  }

  const descuentosParaAplicar = [];

  if (MODELO_IA) {
    try {
      const response = await generateText({
        model: MODELO_IA,
        system: `Eres el agente de logística y almacén de CivicReport.
        Tu labor es deducir qué materiales del catálogo se usaron y en qué cantidades basándote en el comentario de resolución de la obra.
        Genera el listado de materiales y llama a la herramienta para descontarlos.`,
        prompt: `Catálogo de materiales disponibles:
        ${JSON.stringify(catalogo)}
        
        Texto de resolución de la cuadrilla: "${textoResolucion}"`,
        tools: {
          descontar_material: tool({
            description: "Descuenta la cantidad de un material específico del inventario de la entidad.",
            parameters: z.object({
              materialId: z.string().uuid(),
              cantidad: z.number().positive()
            }),
            execute: async ({ materialId, cantidad }) => {
              descuentosParaAplicar.push({ materialId, cantidad });
              return { success: true };
            }
          })
        },
        maxSteps: 3
      });

      // Aplicar los descuentos deducidos por la IA en la BD
      for (const item of descuentosParaAplicar) {
        await aplicarDescuentoInventario(entidadId, item.materialId, item.cantidad);
      }

      return { resumenEjecucion: response.text };
    } catch (e) {
      console.warn("Excepción en procesamiento de inventario IA. Usando fallback Regex local...", e.message);
    }
  }

  // Fallback Heurístico Local con Expresiones Regulares (si no hay clave Groq)
  // Busca patrones como "3 sacos", "2 tubos", "5 bolsas" combinados con nombres de materiales
  const palabrasTexto = textoResolucion.toLowerCase();
  for (const mat of catalogo) {
    const nombreMat = mat.nombre.toLowerCase();
    // Crear una expresión regular flexible para encontrar números cerca del nombre del material
    const regex = new RegExp(`(\\d+)\\s*(?:sacos|bolsas|unidades|metros|tubos|de)?\\s*${nombreMat.substring(0, 10)}`, 'i');
    const match = palabrasTexto.match(regex);
    if (match) {
      const cantidad = Number(match[1]);
      if (cantidad > 0) {
        descuentosParaAplicar.push({ materialId: mat.id, nombre: mat.nombre, cantidad });
        await aplicarDescuentoInventario(entidadId, mat.id, cantidad);
      }
    }
  }

  if (descuentosParaAplicar.length > 0) {
    const listado = descuentosParaAplicar.map(d => `${d.cantidad} unidades de ${d.nombre}`).join(", ");
    return { resumenEjecucion: `Descuento automático de inventario aplicado para: ${listado}.` };
  }

  return { resumenEjecucion: "No se identificaron consumos de materiales específicos en el texto." };
}

// Función auxiliar para restar materiales del inventario de una entidad pública
async function aplicarDescuentoInventario(entidadId, materialId, cantidadADescuentar) {
  try {
    const { data: inv, error: errFetch } = await supabase
      .from("inventario_entidad")
      .select("cantidad")
      .eq("entidad_id", entidadId)
      .eq("material_id", materialId)
      .maybeSingle();

    if (errFetch) throw errFetch;

    if (!inv) {
      // Si el material no estaba en el stock de la entidad, lo insertamos con cantidad negativa
      await supabase
        .from("inventario_entidad")
        .insert([{ entidad_id: entidadId, material_id: materialId, cantidad: -cantidadADescuentar }]);
    } else {
      const nuevaCantidad = Number(inv.cantidad) - cantidadADescuentar;
      await supabase
        .from("inventario_entidad")
        .update({ cantidad: nuevaCantidad })
        .eq("entidad_id", entidadId)
        .eq("material_id", materialId);
    }
  } catch (e) {
    console.error(`Error al actualizar inventario para entidad ${entidadId}, material ${materialId}:`, e.message);
  }
}

/**
 * CASO DE USO 5: Generador de Alertas y Reportes Ejecutivos Semanales
 * Procesa estadísticas brutas y redacta reportes ejecutivos predictivos para tomadores de decisiones
 */
export async function generarReporteEjecutivoSemanal(entidadId) {
  try {
    // Obtener información de la entidad
    const { data: entidad, error: errEnt } = await supabase
      .from("entidades_admin")
      .select("nombre")
      .eq("id", entidadId)
      .maybeSingle();

    const nombreEntidad = entidad?.nombre || "la entidad";

    // Obtener problemáticas asignadas a esta entidad para filtrar denuncias
    const { data: entProbs, error: errProbs } = await supabase
      .from("entidad_problematica")
      .select("problematica:problematicas(nombre)")
      .eq("entidad_id", entidadId);

    const categoriasValidas = (entProbs || [])
      .map(p => p.problematica?.nombre?.toLowerCase())
      .filter(Boolean);

    // Obtener estadísticas de reportes de la entidad
    const { data: reportes, error: errRep } = await supabase
      .from("denuncias")
      .select("categoria, municipio, creado_el")
      .eq("entidad_id", entidadId);

    if (errRep) throw errRep;

    // Filtrar reportes para que contengan únicamente los de la entidad
    const reportesFiltrados = (reportes || []).filter(r => {
      if (!r.categoria) return false;
      // Si no hay categorías configuradas para la entidad, permitimos todos para evitar reportes vacíos,
      // pero si hay configuradas, restringimos estrictamente a ellas.
      if (categoriasValidas.length === 0) return true;
      return categoriasValidas.includes(r.categoria.toLowerCase());
    });

    // Calcular métricas locales
    const totalSemanales = reportesFiltrados.length;
    const porCategoria = {};
    reportesFiltrados.forEach(r => {
      porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + 1;
    });

    const categoriasStr = Object.entries(porCategoria).map(([k, v]) => `${k}: ${v}`).join(", ");
    let reporteEscrito = "";

    if (MODELO_IA) {
      try {
        const response = await generateText({
          model: MODELO_IA,
          system: `Eres un analista de planeación urbana experto de CivicReport para la entidad "${nombreEntidad}". 
          Tu labor es redactar un reporte ejecutivo analítico gubernamental basándote exclusivamente en las estadísticas provistas. 
          Sé formal, constructivo, conciso pero descriptivo (máximo 4-5 párrafos, entre 200 y 250 palabras en total, balanceando el resumen y recomendaciones ejecutivas sin extenderte de forma innecesaria). 
          Está estrictamente prohibido mencionar o sugerir acciones sobre otras competencias ajenas a "${nombreEntidad}".`,
          prompt: `Estadísticas de denuncias de los últimos días para la entidad "${nombreEntidad}":
          Total reportes: ${totalSemanales}
          Desglose por categorías: ${categoriasStr}`,
        });

        reporteEscrito = response.text;
      } catch (e) {
        console.warn("Excepción al generar reporte semanal con IA. Usando plantilla local...", e.message);
      }
    }

    if (!reporteEscrito) {
      // Generación automática del reporte usando una plantilla analítica ejecutiva
      reporteEscrito = `CIVICREPORT - INFORME EJECUTIVO ANALÍTICO: ${nombreEntidad.toUpperCase()}

Durante el período evaluado, la entidad gestionó un total de ${totalSemanales} denuncias ciudadanas activas.
Análisis de incidencias principales: ${categoriasStr || "Sin registros recientes"}.

Se sugiere priorizar recursos hacia las categorías de mayor impacto en "${nombreEntidad}" para optimizar el tiempo de respuesta.`;
    }

    // Insertar el reporte en la tabla de reportes ejecutivos con su correspondiente gráfico
    await supabase.from("reportes_ejecutivos_ia").insert([{
      id_entidad: entidadId,
      contenido_reporte: reporteEscrito,
      datos_grafico: porCategoria
    }]);

    return {
      contenido: reporteEscrito,
      datosGrafico: porCategoria
    };
  } catch (e) {
    console.error("Error en agente de Alertas Ejecutivas:", e.message);
    return {
      contenido: "No se pudo generar el reporte analítico en este momento.",
      datosGrafico: {}
    };
  }
}

/**
 * Agente de Chatbot Analítico: CivicReport's Bot
 * Procesa consultas del administrador en lenguaje natural y devuelve texto y datos estructurados para graficación en base a la entidad logueada.
 */
export async function procesarConsultaChatbot(mensaje, entidadId) {
  try {
    // 1. Obtener problemáticas asignadas a esta entidad para filtrar denuncias
    const { data: entProbs } = await supabase
      .from("entidad_problematica")
      .select("problematica:problematicas(nombre)")
      .eq("entidad_id", entidadId);

    const categoriasValidas = (entProbs || [])
      .map(p => p.problematica?.nombre?.toLowerCase())
      .filter(Boolean);

    // 2. Obtener denuncias de la entidad
    const { data: todasDenuncias } = await supabase
      .from("denuncias")
      .select("estado, categoria, prioridad, creado_el, municipio, departamento")
      .eq("entidad_id", entidadId);

    // Filtrar reportes para que contengan únicamente los de la entidad
    const denuncias = (todasDenuncias || []).filter(r => {
      if (!r.categoria) return false;
      if (categoriasValidas.length === 0) return true;
      return categoriasValidas.includes(r.categoria.toLowerCase());
    });

    // 3. Obtener cuadrillas y calcular su resolución usando cuadrillas_base, cuadrilla_miembros y tareas_kanban
    const { data: cuadrillasBase } = await supabase
      .from("cuadrillas_base")
      .select("id, nombre, id_lider")
      .eq("id_entidad", entidadId);

    const listaCuadrillas = cuadrillasBase || [];
    const idsCuadrillas = listaCuadrillas.map(c => c.id);

    let miembros = [];
    if (idsCuadrillas.length > 0) {
      const { data: miembrosRes } = await supabase
        .from("cuadrilla_miembros")
        .select("id_cuadrilla, id_empleado")
        .in("id_cuadrilla", idsCuadrillas);
      miembros = miembrosRes || [];
    }

    // Obtener técnicos de la cuadrilla (líder + ayudantes)
    const tecnicosIds = Array.from(new Set([
      ...listaCuadrillas.map(c => c.id_lider).filter(Boolean),
      ...miembros.map(m => m.id_empleado).filter(Boolean)
    ]));

    let tareasKanban = [];
    if (tecnicosIds.length > 0) {
      const { data: tareasRes } = await supabase
        .from("tareas_kanban")
        .select("id_responsable, id_denuncia, denuncias!inner(estado)")
        .in("id_responsable", tecnicosIds);
      tareasKanban = tareasRes || [];
    }

    // 4. Compilar datos analíticos reales y limpios
    const statsDenuncias = { pendiente: 0, en_reparacion: 0, completado: 0 };
    const porCategoria = {};
    const porImpacto = { critica: 0, alta: 0, media: 0, baja: 0 };
    const porDepartamento = {};
    const porMunicipio = {};

    denuncias.forEach(d => {
      if (statsDenuncias[d.estado] !== undefined) statsDenuncias[d.estado]++;
      if (d.categoria) porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + 1;
      
      const impactoNormalizado = (d.prioridad || "media").toLowerCase()
        .replace("crítica", "critica")
        .replace("crítico", "critica")
        .replace("critico", "critica");
      if (porImpacto[impactoNormalizado] !== undefined) {
        porImpacto[impactoNormalizado]++;
      }

      if (d.departamento) {
        const dep = d.departamento.trim();
        porDepartamento[dep] = (porDepartamento[dep] || 0) + 1;
      }
      if (d.municipio) {
        const mun = d.municipio.trim();
        porMunicipio[mun] = (porMunicipio[mun] || 0) + 1;
      }
    });

    const statsCuadrillas = listaCuadrillas.map(c => {
      const miembrosCuadrilla = [
        c.id_lider,
        ...miembros.filter(m => m.id_cuadrilla === c.id).map(m => m.id_empleado)
      ].filter(Boolean);

      const tareasDeLaCuadrilla = tareasKanban.filter(t => miembrosCuadrilla.includes(t.id_responsable));
      const total = tareasDeLaCuadrilla.length;
      const completadas = tareasDeLaCuadrilla.filter(t => t.denuncias?.estado === "completado").length;
      const resolucionPct = total > 0 ? Math.round((completadas / total) * 100) : 0;

      return { nombre: c.nombre, total, completadas, resolucionPct };
    });

    const contextoDatos = {
      denunciasPorEstado: statsDenuncias,
      denunciasPorCategoria: porCategoria,
      denunciasPorNivelImpacto: porImpacto,
      denunciasPorDepartamento: porDepartamento,
      denunciasPorMunicipio: porMunicipio,
      resolucionCuadrillas: statsCuadrillas
    };

    let respuestaTexto = "";
    let graficoDetectado = null;

    if (MODELO_IA) {
      try {
        const response = await generateText({
          model: MODELO_IA,
          system: `Eres el Bot de IA oficial de CivicReport ("CivicReport's Bot").
          Tu rol es conversar y responder consultas analíticas basándote únicamente en los datos reales de la entidad del administrador logueado.
          Los datos analíticos reales actuales de la entidad son: ${JSON.stringify(contextoDatos)}.
          
          Si el usuario te pide visualizar, graficar, ver, mostrar o comparar estadísticas (de denuncias, cuadrillas, categorías, nivel de impacto, geográficas, mapa, etc.), DEBES obligatoriamente estructurar tu respuesta como un objeto JSON con el siguiente formato:
          {
            "respuesta": "Texto explicativo analítico breve que describe la gráfica y los datos de la entidad.",
            "grafico": {
              "tipo": "barras" | "columnas" | "dispersion" | "mapa" | "pastel" | "lineas",
              "datos": [
                // Para tipo "barras", "columnas", "mapa", "pastel" o "lineas":
                { "etiqueta": "Etiqueta del Item (ej: Municipio, Categoría o Estado)", "valor": 12 }
                // Para tipo "dispersion" (gráfico de dispersión X-Y):
                { "etiqueta": "Punto A", "x": 10, "y": 25 }
              ]
            }
          }
          
          Instrucciones de mapeo de datos reales para gráficos:
          1. Denuncias por Estado: Mapea "denunciasPorEstado" (ej: etiqueta: "Pendiente", valor: contador).
          2. Denuncias por Categoría: Mapea "denunciasPorCategoria" (ej: etiqueta: nombre de la categoría, valor: contador).
          3. Denuncias por Nivel de Impacto: Mapea "denunciasPorNivelImpacto" (ej: etiqueta: "Critica" | "Alta" | "Media" | "Baja", valor: contador).
          4. Resolución de Cuadrillas: Mapea "resolucionCuadrillas" (ej: etiqueta: nombre de la cuadrilla, valor: resolucionPct).
          5. Gráfico de Dispersión: Asigna valores coherentes para X e Y (ej: X=cantidad de reportes completados, Y=resolucionPct o nivel de prioridad mapeado a numero: Critica=80, Alta=60, Media=40, Baja=20).
          6. Mapa Geográfico (tipo "mapa"): Mapea "denunciasPorDepartamento" o "denunciasPorMunicipio" (ej: etiqueta: nombre del departamento o municipio, valor: contador).
          7. Gráfico de Pastel (tipo "pastel") y Gráfico de Líneas (tipo "lineas"): Mapea cualquier agregación pertinente según el requerimiento de análisis visual del usuario.

          Si no hay datos registrados (valores en 0), genera de todos modos el gráfico con valores en 0 e indícale amigablemente en "respuesta" cómo puede registrar denuncias o asignar cuadrillas para empezar.
          Si el usuario NO te pide visualizar, graficar ni ver datos, responde en texto plano de manera directa sin formato JSON.`,
          prompt: mensaje
        });

        const respuestaLimpia = response.text.trim();
        const indexInicio = respuestaLimpia.indexOf("{");
        const indexFin = respuestaLimpia.lastIndexOf("}");

        if (indexInicio !== -1 && indexFin !== -1 && indexFin > indexInicio) {
          const posibleJson = respuestaLimpia.substring(indexInicio, indexFin + 1);
          try {
            const parsed = JSON.parse(posibleJson);
            respuestaTexto = parsed.respuesta || "Aquí tienes el gráfico solicitado:";
            graficoDetectado = parsed.grafico;
          } catch (errJson) {
            console.warn("Fallo al parsear JSON extraído del chatbot:", errJson.message);
            respuestaTexto = respuestaLimpia;
          }
        } else {
          respuestaTexto = respuestaLimpia;
        }
      } catch (e) {
        console.error("Error al procesar mensaje con Groq:", e);
      }
    }

    if (!respuestaTexto) {
      respuestaTexto = "Hola, soy el asistente virtual de CivicReport. Puedo ayudarte a graficar la distribución de denuncias o evaluar la productividad de las cuadrillas. Prueba escribiendo: 'grafica las denuncias por estado'.";
    }

    return { texto: respuestaTexto, grafico: graficoDetectado };
  } catch (err) {
    console.error("Error en procesarConsultaChatbot:", err);
    return { texto: "Ocurrió un error en el asistente virtual de CivicReport.", grafico: null };
  }
}

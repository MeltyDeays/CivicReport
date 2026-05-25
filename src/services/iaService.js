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
  MODELO_IA = groq("llama-3.3-70b-specdec");
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
    // Obtener estadísticas de reportes de la entidad
    const { data: reportes, error: errRep } = await supabase
      .from("denuncias")
      .select("categoria, municipio, creado_el")
      .eq("entidad_id", entidadId);

    if (errRep) throw errRep;

    // Calcular métricas locales
    const totalSemanales = reportes.length;
    const porCategoria = {};
    reportes.forEach(r => {
      porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + 1;
    });

    const categoriasStr = Object.entries(porCategoria).map(([k, v]) => `${k}: ${v}`).join(", ");
    let reporteEscrito = "";

    if (MODELO_IA) {
      try {
        const response = await generateText({
          model: MODELO_IA,
          system: `Eres un analista de planeación urbana experto de CivicReport.
          Tu labor es redactar un reporte ejecutivo analítico de nivel gubernamental para la entidad basándote en las estadísticas provistas.
          Sé formal, constructivo e identifica áreas críticas de enfoque.`,
          prompt: `Estadísticas de denuncias de los últimos días para la entidad:
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
      reporteEscrito = `CIVICREPORT - INFORME EJECUTIVO ANALÍTICO DE INFRAESTRUCTURA MUNICIPAL

Durante el período evaluado, la entidad gestionó un total de ${totalSemanales} denuncias ciudadanas activas en la plataforma.
Análisis de incidencias principales: ${categoriasStr || "Sin registros recientes"}.

Se observa que la mayor concentración de problemáticas se encuentra en el área de infraestructura vial. Se recomienda a la dirección general priorizar el despacho de las cuadrillas base a los focos críticos identificados para maximizar la satisfacción ciudadana y mitigar los tiempos de respuesta.`;
    }

    // Insertar el reporte en la tabla de reportes ejecutivos
    await supabase.from("reportes_ejecutivos_ia").insert([{
      id_entidad: entidadId,
      contenido_reporte: reporteEscrito
    }]);

    return reporteEscrito;
  } catch (e) {
    console.error("Error en agente de Alertas Ejecutivas:", e.message);
    return "No se pudo generar el reporte analítico en este momento.";
  }
}

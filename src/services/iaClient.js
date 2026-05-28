// Archivo: src/services/iaClient.js
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";

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

export const tieneIA = () => !!MODELO_IA;

/**
 * Llama al LLM para validar duplicidad y spam en un reporte.
 */
export async function llamarModeracionAntiSpam(nuevoReporte, reportesCercanos) {
  if (!MODELO_IA) throw new Error("IA no configurada");
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
  return response.text;
}

/**
 * Llama al LLM para deducir inventario consumido a partir del comentario de resolución.
 */
export async function llamarDeduccionInventario(textoResolucion, catalogo) {
  if (!MODELO_IA) throw new Error("IA no configurada");
  const descuentosParaAplicar = [];
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
  return {
    textoRespuesta: response.text,
    descuentosParaAplicar
  };
}

/**
 * Llama al LLM para generar un reporte ejecutivo analítico.
 */
export async function llamarReporteEjecutivo(nombreEntidad, totalSemanales, categoriasStr) {
  if (!MODELO_IA) throw new Error("IA no configurada");
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
  return response.text;
}

/**
 * Llama al LLM para procesar la consulta del chatbot y retornar respuesta estructurada.
 */
export async function llamarChatbotAnalitico(mensaje, contextoDatos) {
  if (!MODELO_IA) throw new Error("IA no configurada");
  const response = await generateText({
    model: MODELO_IA,
    system: `Eres el Bot de IA oficial de CivicReport ("CivicReport's Bot").
    Tu rol es conversar y responder consultas analíticas basándote únicamente en los datos reales de la entidad del administrador logueado.
    Los datos analíticos reales actuales de la entidad son: ${JSON.stringify(contextoDatos)}.
    
    Si el usuario te pide visualizar, graficar, ver, mostrar o comparar estadísticas (de denuncias, cuadrillas, categorías, nivel de impacto, geográficas, mapa, etc.), DEBES obligatoriamente estructurar tu respuesta como un objeto JSON con el siguiente formato:
    {
      "respuesta": "Texto analítico estructurado que describe los datos y los KPI de la entidad.",
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
    
    Instrucciones de formato e inspiración de observabilidad (Grafana & Firecrawl Dashboard Reporting) para la propiedad 'respuesta':
    - Comienza con una fila de STAT CARDS (Métricas de un solo valor) usando emojis y corchetes, por ejemplo:
      "📊 [Total: 25] | ⚙️ [En Curso: 10] | ✅ [Completados: 15]" o "👥 [Cuadrillas: 4] | ⚡ [Resolución: 82%]"
    - Estructura el análisis aplicando el método RED/USE:
      1. Rate (Tasa de reportes entrantes o volumen total).
      2. Saturation/Errors (Capacidad de resolución de las cuadrillas y porcentaje de tareas completadas).
      3. Duration (Distribución temporal o prioridades que requieren atención inmediata).
    - Termina con una sección de advertencias o sugerencias de optimización breves (ej: 'Alerta: La cuadrilla X tiene sobrecarga de trabajo').

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
  return response.text;
}

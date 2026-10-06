/*
 * Funcionalidad: Servicio de dominio de retroalimentación de evaluación
 * Descripción: Construye el prompt pedagógico para el modelo de lenguaje, interpreta su respuesta JSON y genera la retroalimentación determinística de respaldo cuando la IA no está disponible
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCaseDetail } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  type ConfigurationComparison,
  type EvaluationFeedback,
  type ExpertConfigurationData,
  type ParameterComparison,
  type VentilatorConfiguration,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";

export const FEEDBACK_AI_TEMPERATURE: number = 0.7;
export const FEEDBACK_AI_MAX_TOKENS: number = 1500;

const CRITICAL_SAFETY_CONCERN: string = "Revisa los parámetros críticos fuera de rango";

interface ParsedFeedback {
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  recommendations?: string[];
  safetyConcerns?: string[];
}

export function buildFeedbackPrompt(
  clinicalCase: ClinicalCaseDetail,
  userConfig: VentilatorConfiguration,
  expertConfig: ExpertConfigurationData,
  differences: ConfigurationComparison,
): string {
  const parameterDetail: string = differences.parameters.map((p: ParameterComparison) => formatParameterLine(p)).join("\n");

  return `Eres un experto en ventilación mecánica actuando como tutor educativo. Analiza la siguiente evaluación de caso clínico y proporciona retroalimentación educativa.

CASO CLÍNICO:
Título: ${clinicalCase.title}
Descripción: ${clinicalCase.description}
Paciente: ${clinicalCase.patientAge} años, ${clinicalCase.patientWeight} kg
Diagnóstico: ${clinicalCase.mainDiagnosis}
Comorbilidades: ${clinicalCase.comorbidities.join(", ")}
Patología: ${clinicalCase.pathology}
Dificultad: ${clinicalCase.difficulty}

${clinicalCase.labData ? `DATOS DE LABORATORIO:
${JSON.stringify(clinicalCase.labData, null, 2)}` : ""}

CONFIGURACIÓN DEL USUARIO:
Modo: ${userConfig.ventilationMode}
${userConfig.tidalVolume !== undefined ? `Volumen Tidal: ${userConfig.tidalVolume} ml` : ""}
${userConfig.respiratoryRate !== undefined ? `Frecuencia Respiratoria: ${userConfig.respiratoryRate} resp/min` : ""}
${userConfig.peep !== undefined ? `PEEP: ${userConfig.peep} cmH2O` : ""}
${userConfig.fio2 !== undefined ? `FiO2: ${userConfig.fio2}%` : ""}
${userConfig.maxPressure !== undefined ? `Presión Máxima: ${userConfig.maxPressure} cmH2O` : ""}
${userConfig.iERatio ? `Relación I:E: ${userConfig.iERatio}` : ""}

CONFIGURACIÓN EXPERTA RECOMENDADA:
Modo: ${expertConfig.ventilationMode}
${expertConfig.tidalVolume !== undefined ? `Volumen Tidal: ${expertConfig.tidalVolume} ml` : ""}
${expertConfig.respiratoryRate !== undefined ? `Frecuencia Respiratoria: ${expertConfig.respiratoryRate} resp/min` : ""}
${expertConfig.peep !== undefined ? `PEEP: ${expertConfig.peep} cmH2O` : ""}
${expertConfig.fio2 !== undefined ? `FiO2: ${expertConfig.fio2}%` : ""}
${expertConfig.maxPressure !== undefined ? `Presión Máxima: ${expertConfig.maxPressure} cmH2O` : ""}
${expertConfig.iERatio ? `Relación I:E: ${expertConfig.iERatio}` : ""}

JUSTIFICACIÓN DE LA CONFIGURACIÓN EXPERTA:
${expertConfig.justification}

ANÁLISIS DE DIFERENCIAS:
Score: ${differences.score}/100
Parámetros correctos: ${differences.correctParameters}/${differences.totalParameters}
Errores críticos: ${differences.criticalErrors.length > 0 ? differences.criticalErrors.join(", ") : "Ninguno"}

DETALLE DE PARÁMETROS:
${parameterDetail}

INSTRUCCIONES PARA LA RETROALIMENTACIÓN:
1. Usa un tono EDUCATIVO y CONSTRUCTIVO, nunca punitivo
2. Reconoce lo que el estudiante hizo bien
3. Explica los errores de forma clara y educativa
4. Proporciona recomendaciones específicas y accionables
5. Prioriza la seguridad del paciente
6. Menciona consideraciones de seguridad si hay errores críticos
7. Usa lenguaje médico apropiado pero accesible
8. Responde en ESPAÑOL

FORMATO DE RESPUESTA (JSON):
{
  "feedback": "Texto principal de retroalimentación (2-3 párrafos)",
  "strengths": ["Fortaleza 1", "Fortaleza 2"],
  "improvements": ["Área de mejora 1", "Área de mejora 2"],
  "recommendations": ["Recomendación 1", "Recomendación 2"],
  "safetyConcerns": ["Preocupación de seguridad si aplica"]
}

Responde SOLO con el JSON, sin texto adicional.`;
}

export function parseFeedbackResponse(aiResponse: string, differences: ConfigurationComparison): EvaluationFeedback {
  try {
    const jsonMatch: RegExpMatchArray | null = aiResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed: ParsedFeedback = JSON.parse(jsonMatch[0]) as ParsedFeedback;

      return {
        feedback: parsed.feedback || aiResponse,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        recommendations: parsed.recommendations || [],
        safetyConcerns: parsed.safetyConcerns || (differences.criticalErrors.length > 0 ? [CRITICAL_SAFETY_CONCERN] : undefined),
      };
    }
  } catch {
    return buildRawFeedback(aiResponse, differences);
  }

  return buildRawFeedback(aiResponse, differences);
}

export function generateFallbackFeedback(differences: ConfigurationComparison): EvaluationFeedback {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  differences.parameters.forEach((param: ParameterComparison) => {
    if (param.errorClassification === "correcto") {
      strengths.push(`${param.parameter} está correctamente configurado`);
    } else {
      improvements.push(`${param.parameter} necesita ajuste (diferencia: ${param.difference})`);
      recommendations.push(`Ajusta ${param.parameter} hacia ${param.expertValue}`);
    }
  });

  let feedback: string = `Tu configuración obtuvo un score de ${differences.score}/100. `;

  if (differences.criticalErrors.length > 0) {
    feedback += `Hay ${differences.criticalErrors.length} error(es) crítico(s) que deben corregirse: ${differences.criticalErrors.join(", ")}. `;
  }

  feedback += "Revisa las recomendaciones para mejorar tu configuración.";

  return {
    feedback,
    strengths,
    improvements,
    recommendations,
    safetyConcerns: differences.criticalErrors.length > 0 ? [CRITICAL_SAFETY_CONCERN] : undefined,
  };
}

function formatParameterLine(p: ParameterComparison): string {
  const status: string =
    p.errorClassification === "correcto" ? "✓" : p.errorClassification === "menor" ? "⚠" : p.errorClassification === "moderado" ? "⚠⚠" : "✗";

  return `${status} ${p.parameter}: Usuario=${p.userValue}, Experto=${p.expertValue}${p.difference !== null ? ` (Diferencia: ${p.difference})` : ""}`;
}

function buildRawFeedback(aiResponse: string, differences: ConfigurationComparison): EvaluationFeedback {
  return {
    feedback: aiResponse,
    strengths: [],
    improvements: [],
    recommendations: [],
    safetyConcerns: differences.criticalErrors.length > 0 ? [CRITICAL_SAFETY_CONCERN] : undefined,
  };
}

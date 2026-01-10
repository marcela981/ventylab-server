import { prisma } from '../../config/prisma';
import { ClinicalCaseData, ExpertConfigurationData, UserConfiguration, ConfigurationComparison, ParameterComparison, EvaluationFeedback, EvaluationAttemptData, CaseSearchCriteria } from '../../types/evaluation';
import { aiServiceManager } from '../ai/AIServiceManager';
import { CaseDifficulty, Pathology } from '@prisma/client';

/**
 * Obtener caso clínico por ID o criterios de búsqueda
 */
export async function getClinicalCase(
  caseId?: string,
  criteria?: CaseSearchCriteria,
  includeExpertConfig: boolean = true
): Promise<ClinicalCaseData | ClinicalCaseData[] | null> {
  try {
    // Si se proporciona un ID, buscar por ID
    if (caseId) {
      const clinicalCase = await prisma.clinicalCase.findUnique({
        where: { id: caseId },
        include: {
          expertConfiguration: includeExpertConfig,
        },
      });

      if (!clinicalCase) {
        return null;
      }

      return mapToClinicalCaseData(clinicalCase);
    }

    // Si se proporcionan criterios, buscar por criterios
    if (criteria) {
      const where: any = {};

      if (criteria.difficulty) {
        where.difficulty = criteria.difficulty.toUpperCase() as CaseDifficulty;
      }

      if (criteria.pathology) {
        where.pathology = criteria.pathology.toUpperCase() as Pathology;
      }

      if (criteria.isActive !== undefined) {
        where.isActive = criteria.isActive;
      } else {
        where.isActive = true; // Por defecto solo casos activos
      }

      const cases = await prisma.clinicalCase.findMany({
        where,
        include: {
          expertConfiguration: includeExpertConfig,
        },
        take: criteria.limit || 10,
        skip: criteria.offset || 0,
        orderBy: { createdAt: 'desc' },
      });

      return cases.map(mapToClinicalCaseData);
    }

    throw new Error('Debe proporcionarse caseId o criteria');
  } catch (error: any) {
    console.error('Error al obtener caso clínico:', error);
    throw new Error(`Error al consultar caso clínico: ${error.message}`);
  }
}

/**
 * Mapear caso clínico de Prisma a formato de datos
 */
function mapToClinicalCaseData(caseData: any): ClinicalCaseData {
  return {
    id: caseData.id,
    title: caseData.title,
    description: caseData.description,
    patientAge: caseData.patientAge,
    patientWeight: caseData.patientWeight,
    mainDiagnosis: caseData.mainDiagnosis,
    comorbidities: caseData.comorbidities,
    labData: caseData.labData,
    difficulty: caseData.difficulty,
    pathology: caseData.pathology,
    educationalGoal: caseData.educationalGoal,
    expertConfiguration: caseData.expertConfiguration
      ? {
          id: caseData.expertConfiguration.id,
          ventilationMode: caseData.expertConfiguration.ventilationMode,
          tidalVolume: caseData.expertConfiguration.tidalVolume ?? undefined,
          respiratoryRate: caseData.expertConfiguration.respiratoryRate ?? undefined,
          peep: caseData.expertConfiguration.peep ?? undefined,
          fio2: caseData.expertConfiguration.fio2 ?? undefined,
          maxPressure: caseData.expertConfiguration.maxPressure ?? undefined,
          iERatio: caseData.expertConfiguration.iERatio ?? undefined,
          justification: caseData.expertConfiguration.justification,
          acceptableRanges: caseData.expertConfiguration.acceptableRanges as Record<string, { min: number; max: number }> | undefined,
          parameterPriorities: caseData.expertConfiguration.parameterPriorities as Record<string, string> | undefined,
        }
      : undefined,
  };
}

/**
 * Comparar configuración del usuario con configuración experta
 */
export async function compareConfigurations(
  userConfig: UserConfiguration,
  expertConfig: ExpertConfigurationData
): Promise<ConfigurationComparison> {
  try {
    // Validar inputs
    if (!userConfig || !expertConfig) {
      throw new Error('Configuraciones requeridas para comparación');
    }

    const parameters: ParameterComparison[] = [];
    const criticalErrors: string[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Obtener rangos aceptables y prioridades
    const acceptableRanges = expertConfig.acceptableRanges || {};
    const parameterPriorities = expertConfig.parameterPriorities || {};

    // Comparar cada parámetro
    const paramMappings = [
      { key: 'tidalVolume', label: 'Volumen Tidal (Vt)', expert: expertConfig.tidalVolume, user: userConfig.tidalVolume, unit: 'ml' },
      { key: 'respiratoryRate', label: 'Frecuencia Respiratoria (FR)', expert: expertConfig.respiratoryRate, user: userConfig.respiratoryRate, unit: 'resp/min' },
      { key: 'peep', label: 'PEEP', expert: expertConfig.peep, user: userConfig.peep, unit: 'cmH2O' },
      { key: 'fio2', label: 'FiO2', expert: expertConfig.fio2, user: userConfig.fio2, unit: '%' },
      { key: 'maxPressure', label: 'Presión Máxima', expert: expertConfig.maxPressure, user: userConfig.maxPressure, unit: 'cmH2O' },
    ];

    for (const param of paramMappings) {
      if (param.expert === undefined && param.user === undefined) {
        continue; // Parámetro no aplicable
      }

      const comparison = compareParameter(
        param.key,
        param.label,
        param.user,
        param.expert,
        acceptableRanges[param.key],
        parameterPriorities[param.key] || 'OPCIONAL'
      );

      parameters.push(comparison);

      // Calcular score ponderado
      const weight = getParameterWeight(comparison.priority);
      const paramScore = calculateParameterScore(comparison);
      totalScore += paramScore * weight;
      totalWeight += weight;

      // Identificar errores críticos
      if (comparison.errorClassification === 'critico') {
        criticalErrors.push(param.label);
      }
    }

    // Comparar modo de ventilación (especial)
    if (userConfig.ventilationMode && expertConfig.ventilationMode) {
      const modeMatch = userConfig.ventilationMode.toLowerCase() === expertConfig.ventilationMode.toLowerCase();
      const modeComparison: ParameterComparison = {
        parameter: 'ventilationMode',
        userValue: userConfig.ventilationMode,
        expertValue: expertConfig.ventilationMode,
        difference: null,
        differencePercent: null,
        withinRange: modeMatch,
        errorClassification: modeMatch ? 'correcto' : 'critico',
        priority: parameterPriorities['ventilationMode'] || 'CRITICO',
      };

      parameters.push(modeComparison);

      if (!modeMatch) {
        criticalErrors.push('Modo de Ventilación');
      }

      const weight = getParameterWeight(modeComparison.priority);
      const paramScore = modeMatch ? 100 : 0;
      totalScore += paramScore * weight;
      totalWeight += weight;
    }

    // Comparar relación I:E si aplica
    if (userConfig.iERatio && expertConfig.iERatio) {
      const ratioMatch = normalizeIERatio(userConfig.iERatio) === normalizeIERatio(expertConfig.iERatio);
      const ratioComparison: ParameterComparison = {
        parameter: 'iERatio',
        userValue: userConfig.iERatio,
        expertValue: expertConfig.iERatio,
        difference: null,
        differencePercent: null,
        withinRange: ratioMatch,
        errorClassification: ratioMatch ? 'correcto' : 'moderado',
        priority: parameterPriorities['iERatio'] || 'IMPORTANTE',
      };

      parameters.push(ratioComparison);

      const weight = getParameterWeight(ratioComparison.priority);
      const paramScore = ratioMatch ? 100 : 70; // Penalización menor para I:E
      totalScore += paramScore * weight;
      totalWeight += weight;
    }

    // Calcular score global
    const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;

    // Resumen de clasificaciones
    const summary = {
      correct: parameters.filter(p => p.errorClassification === 'correcto').length,
      minor: parameters.filter(p => p.errorClassification === 'menor').length,
      moderate: parameters.filter(p => p.errorClassification === 'moderado').length,
      critical: parameters.filter(p => p.errorClassification === 'critico').length,
    };

    return {
      score: Math.max(0, Math.min(100, finalScore)),
      totalParameters: parameters.length,
      correctParameters: summary.correct,
      parameters,
      criticalErrors,
      summary,
    };
  } catch (error: any) {
    console.error('Error al comparar configuraciones:', error);
    throw new Error(`Error en comparación de configuraciones: ${error.message}`);
  }
}

/**
 * Comparar un parámetro individual
 */
function compareParameter(
  key: string,
  label: string,
  userValue: number | undefined,
  expertValue: number | undefined,
  acceptableRange?: { min: number; max: number },
  priority: string = 'OPCIONAL'
): ParameterComparison {
  // Si ambos valores son undefined, considerar correcto
  if (userValue === undefined && expertValue === undefined) {
    return {
      parameter: key,
      userValue: undefined,
      expertValue: undefined,
      difference: null,
      differencePercent: null,
      withinRange: true,
      errorClassification: 'correcto',
      priority,
      acceptableRange,
    };
  }

  // Si uno es undefined, considerar error
  if (userValue === undefined || expertValue === undefined) {
    return {
      parameter: key,
      userValue,
      expertValue,
      difference: null,
      differencePercent: null,
      withinRange: false,
      errorClassification: priority === 'CRITICO' ? 'critico' : 'moderado',
      priority,
      acceptableRange,
    };
  }

  // Calcular diferencias
  const difference = userValue - expertValue;
  const differencePercent = expertValue !== 0
    ? (difference / expertValue) * 100
    : (userValue !== 0 ? 100 : 0);

  // Verificar si está dentro del rango aceptable
  let withinRange = true;
  if (acceptableRange) {
    withinRange = userValue >= acceptableRange.min && userValue <= acceptableRange.max;
  } else {
    // Si no hay rango, usar tolerancia del 10%
    const tolerance = Math.abs(expertValue * 0.1);
    withinRange = Math.abs(difference) <= tolerance;
  }

  // Clasificar error
  let errorClassification: 'correcto' | 'menor' | 'moderado' | 'critico' = 'correcto';

  if (!withinRange) {
    const absDifferencePercent = Math.abs(differencePercent);
    if (priority === 'CRITICO') {
      errorClassification = absDifferencePercent > 20 ? 'critico' : 'moderado';
    } else if (priority === 'IMPORTANTE') {
      errorClassification = absDifferencePercent > 30 ? 'moderado' : 'menor';
    } else {
      errorClassification = absDifferencePercent > 50 ? 'moderado' : 'menor';
    }
  } else if (Math.abs(differencePercent) > 5) {
    errorClassification = 'menor';
  }

  return {
    parameter: key,
    userValue,
    expertValue,
    difference,
    differencePercent: Math.round(differencePercent * 100) / 100,
    withinRange,
    errorClassification,
    priority,
    acceptableRange,
  };
}

/**
 * Normalizar relación I:E para comparación
 */
function normalizeIERatio(ratio: string): string {
  return ratio.replace(/\s/g, '').toLowerCase();
}

/**
 * Obtener peso de parámetro según prioridad
 */
function getParameterWeight(priority: string): number {
  switch (priority.toUpperCase()) {
    case 'CRITICO':
      return 3;
    case 'IMPORTANTE':
      return 2;
    case 'OPCIONAL':
      return 1;
    default:
      return 1;
  }
}

/**
 * Calcular score de un parámetro individual
 */
function calculateParameterScore(comparison: ParameterComparison): number {
  if (comparison.errorClassification === 'correcto') {
    return 100;
  }

  if (comparison.withinRange) {
    // Dentro del rango pero con diferencia menor
    const absDiffPercent = Math.abs(comparison.differencePercent || 0);
    return Math.max(80, 100 - absDiffPercent);
  }

  // Fuera del rango
  const absDiffPercent = Math.abs(comparison.differencePercent || 0);
  
  switch (comparison.errorClassification) {
    case 'menor':
      return Math.max(60, 100 - absDiffPercent * 0.5);
    case 'moderado':
      return Math.max(40, 100 - absDiffPercent);
    case 'critico':
      return Math.max(0, 100 - absDiffPercent * 1.5);
    default:
      return 50;
  }
}

/**
 * Generar retroalimentación con IA
 */
export async function generateFeedback(
  clinicalCase: ClinicalCaseData,
  userConfig: UserConfiguration,
  expertConfig: ExpertConfigurationData,
  differences: ConfigurationComparison
): Promise<EvaluationFeedback> {
  try {
    // Validar inputs
    if (!clinicalCase || !userConfig || !expertConfig || !differences) {
      throw new Error('Datos incompletos para generar retroalimentación');
    }

    // Construir prompt estructurado
    const prompt = buildFeedbackPrompt(clinicalCase, userConfig, expertConfig, differences);

    // Llamar al servicio de IA
    const aiResponse = await aiServiceManager.generateResponse(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
    });

    if (!aiResponse.success || !aiResponse.response) {
      throw new Error('Error al generar retroalimentación con IA');
    }

    // Procesar respuesta del LLM
    const feedback = parseFeedbackResponse(aiResponse.response, differences);

    // Log de generación de feedback
    console.log(`[${new Date().toISOString()}] Feedback generado para caso ${clinicalCase.id}`);

    return feedback;
  } catch (error: any) {
    console.error('Error al generar retroalimentación:', error);
    
    // Fallback: generar feedback básico sin IA
    return generateFallbackFeedback(differences);
  }
}

/**
 * Construir prompt para el LLM
 */
function buildFeedbackPrompt(
  clinicalCase: ClinicalCaseData,
  userConfig: UserConfiguration,
  expertConfig: ExpertConfigurationData,
  differences: ConfigurationComparison
): string {
  const modeText = expertConfig.ventilationMode === 'volume' ? 'Volumen Control' : 'Presión Control';

  return `Eres un experto en ventilación mecánica actuando como tutor educativo. Analiza la siguiente evaluación de caso clínico y proporciona retroalimentación educativa.

CASO CLÍNICO:
Título: ${clinicalCase.title}
Descripción: ${clinicalCase.description}
Paciente: ${clinicalCase.patientAge} años, ${clinicalCase.patientWeight} kg
Diagnóstico: ${clinicalCase.mainDiagnosis}
Comorbilidades: ${clinicalCase.comorbidities.join(', ')}
Patología: ${clinicalCase.pathology}
Dificultad: ${clinicalCase.difficulty}

${clinicalCase.labData ? `DATOS DE LABORATORIO:
${JSON.stringify(clinicalCase.labData, null, 2)}` : ''}

CONFIGURACIÓN DEL USUARIO:
Modo: ${userConfig.ventilationMode}
${userConfig.tidalVolume !== undefined ? `Volumen Tidal: ${userConfig.tidalVolume} ml` : ''}
${userConfig.respiratoryRate !== undefined ? `Frecuencia Respiratoria: ${userConfig.respiratoryRate} resp/min` : ''}
${userConfig.peep !== undefined ? `PEEP: ${userConfig.peep} cmH2O` : ''}
${userConfig.fio2 !== undefined ? `FiO2: ${userConfig.fio2}%` : ''}
${userConfig.maxPressure !== undefined ? `Presión Máxima: ${userConfig.maxPressure} cmH2O` : ''}
${userConfig.iERatio ? `Relación I:E: ${userConfig.iERatio}` : ''}

CONFIGURACIÓN EXPERTA RECOMENDADA:
Modo: ${expertConfig.ventilationMode}
${expertConfig.tidalVolume !== undefined ? `Volumen Tidal: ${expertConfig.tidalVolume} ml` : ''}
${expertConfig.respiratoryRate !== undefined ? `Frecuencia Respiratoria: ${expertConfig.respiratoryRate} resp/min` : ''}
${expertConfig.peep !== undefined ? `PEEP: ${expertConfig.peep} cmH2O` : ''}
${expertConfig.fio2 !== undefined ? `FiO2: ${expertConfig.fio2}%` : ''}
${expertConfig.maxPressure !== undefined ? `Presión Máxima: ${expertConfig.maxPressure} cmH2O` : ''}
${expertConfig.iERatio ? `Relación I:E: ${expertConfig.iERatio}` : ''}

JUSTIFICACIÓN DE LA CONFIGURACIÓN EXPERTA:
${expertConfig.justification}

ANÁLISIS DE DIFERENCIAS:
Score: ${differences.score}/100
Parámetros correctos: ${differences.correctParameters}/${differences.totalParameters}
Errores críticos: ${differences.criticalErrors.length > 0 ? differences.criticalErrors.join(', ') : 'Ninguno'}

DETALLE DE PARÁMETROS:
${differences.parameters.map(p => {
  const status = p.errorClassification === 'correcto' ? '✓' : 
                 p.errorClassification === 'menor' ? '⚠' :
                 p.errorClassification === 'moderado' ? '⚠⚠' : '✗';
  return `${status} ${p.parameter}: Usuario=${p.userValue}, Experto=${p.expertValue}${p.difference !== null ? ` (Diferencia: ${p.difference})` : ''}`;
}).join('\n')}

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

/**
 * Parsear respuesta del LLM
 */
function parseFeedbackResponse(aiResponse: string, differences: ConfigurationComparison): EvaluationFeedback {
  try {
    // Intentar extraer JSON de la respuesta
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        feedback: parsed.feedback || aiResponse,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        recommendations: parsed.recommendations || [],
        safetyConcerns: parsed.safetyConcerns || (differences.criticalErrors.length > 0 ? ['Revisa los parámetros críticos fuera de rango'] : undefined),
      };
    }
  } catch (error) {
    console.warn('No se pudo parsear JSON de la respuesta de IA, usando respuesta completa');
  }

  // Fallback: usar respuesta completa como feedback
  return {
    feedback: aiResponse,
    strengths: [],
    improvements: [],
    recommendations: [],
    safetyConcerns: differences.criticalErrors.length > 0 ? ['Revisa los parámetros críticos fuera de rango'] : undefined,
  };
}

/**
 * Generar feedback básico sin IA (fallback)
 */
function generateFallbackFeedback(differences: ConfigurationComparison): EvaluationFeedback {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  differences.parameters.forEach(param => {
    if (param.errorClassification === 'correcto') {
      strengths.push(`${param.parameter} está correctamente configurado`);
    } else {
      improvements.push(`${param.parameter} necesita ajuste (diferencia: ${param.difference})`);
      recommendations.push(`Ajusta ${param.parameter} hacia ${param.expertValue}`);
    }
  });

  let feedback = `Tu configuración obtuvo un score de ${differences.score}/100. `;
  
  if (differences.criticalErrors.length > 0) {
    feedback += `Hay ${differences.criticalErrors.length} error(es) crítico(s) que deben corregirse: ${differences.criticalErrors.join(', ')}. `;
  }
  
  feedback += `Revisa las recomendaciones para mejorar tu configuración.`;

  return {
    feedback,
    strengths,
    improvements,
    recommendations,
    safetyConcerns: differences.criticalErrors.length > 0 ? ['Revisa los parámetros críticos fuera de rango'] : undefined,
  };
}

/**
 * Guardar intento de evaluación
 */
export async function saveEvaluationAttempt(
  userId: string,
  caseId: string,
  userConfig: UserConfiguration,
  score: number,
  differences: ConfigurationComparison,
  feedback: string,
  completionTime?: number
): Promise<EvaluationAttemptData> {
  try {
    // Validar inputs
    if (!userId || !caseId || !userConfig) {
      throw new Error('Datos incompletos para guardar intento');
    }

    if (score < 0 || score > 100) {
      throw new Error('Score debe estar entre 0 y 100');
    }

    // Determinar si fue exitoso (score >= 70 por defecto)
    const isSuccessful = score >= 70;

    // Crear registro en la base de datos
    const attempt = await prisma.evaluationAttempt.create({
      data: {
        userId,
        clinicalCaseId: caseId,
        userConfiguration: userConfig as any,
        score,
        differences: differences as any,
        aiFeedback: feedback,
        completionTime,
        isSuccessful,
        completedAt: new Date(),
      },
      include: {
        clinicalCase: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Log de intento guardado
    console.log(`[${new Date().toISOString()}] Intento de evaluación guardado: Usuario ${userId}, Caso ${caseId}, Score: ${score}`);

    // Validar y convertir userConfiguration
    const userConfigData = attempt.userConfiguration;
    if (!userConfigData || typeof userConfigData !== 'object' || Array.isArray(userConfigData)) {
      throw new Error('Invalid user configuration format');
    }
    const savedUserConfig = userConfigData as unknown as UserConfiguration;

    // Validar y convertir differences (comparison)
    const comparisonData = attempt.differences;
    if (!comparisonData || typeof comparisonData !== 'object' || Array.isArray(comparisonData)) {
      throw new Error('Invalid comparison format');
    }
    const savedDifferences = comparisonData as unknown as ConfigurationComparison;

    return {
      id: attempt.id,
      userId: attempt.userId,
      clinicalCaseId: attempt.clinicalCaseId,
      userConfiguration: savedUserConfig,
      score: attempt.score,
      differences: savedDifferences,
      aiFeedback: attempt.aiFeedback || '',
      completionTime: attempt.completionTime ?? undefined,
      isSuccessful: attempt.isSuccessful,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt ?? undefined,
    };
  } catch (error: any) {
    console.error('Error al guardar intento de evaluación:', error);
    throw new Error(`Error al guardar intento: ${error.message}`);
  }
}

export default {
  getClinicalCase,
  compareConfigurations,
  generateFeedback,
  saveEvaluationAttempt,
};


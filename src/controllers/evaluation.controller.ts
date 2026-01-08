import { Request, Response } from 'express';
import {
  getClinicalCase,
  compareConfigurations,
  generateFeedback,
  saveEvaluationAttempt,
} from '../services/evaluation/evaluation.service';
import { CaseSearchCriteria, UserConfiguration } from '../types/evaluation';
import { prisma } from '../config/prisma';

// Rate limiting simple en memoria
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests por minuto

/**
 * Verificar rate limiting para un usuario
 */
function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset o crear nuevo límite
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Incrementar contador
  userLimit.count++;
  return { allowed: true };
}

/**
 * Configurar headers de respuesta
 */
function setResponseHeaders(res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * GET /api/cases
 * Obtener lista de casos clínicos disponibles
 */
export const getCases = async (req: Request, res: Response) => {
  try {
    setResponseHeaders(res);

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para ver casos clínicos',
      });
    }

    // Extraer query params
    const difficulty = req.query.nivel as string | undefined;
    const pathology = req.query.patologia as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    // Validar limit y offset
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El límite debe estar entre 1 y 50',
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El offset debe ser mayor o igual a 0',
      });
    }

    // Construir criterios de búsqueda
    const criteria: CaseSearchCriteria = {
      isActive: true, // Solo casos activos
      limit,
      offset,
    };

    if (difficulty) {
      const validDifficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
      if (!validDifficulties.includes(difficulty.toUpperCase())) {
        return res.status(400).json({
          error: 'Parámetro inválido',
          message: `El nivel debe ser uno de: ${validDifficulties.join(', ')}`,
        });
      }
      criteria.difficulty = difficulty.toUpperCase();
    }

    if (pathology) {
      const validPathologies = [
        'EPOC', 'SDRA', 'NEUMONIA', 'ASMA', 'FIBROSIS_PULMONAR',
        'EDEMA_PULMONAR', 'EMBOLIA_PULMONAR', 'TEP', 'BRONQUIOLITIS',
        'SINDROME_DE_DISTRES_RESPIRATORIO', 'OTRAS',
      ];
      if (!validPathologies.includes(pathology.toUpperCase())) {
        return res.status(400).json({
          error: 'Parámetro inválido',
          message: `La patología debe ser una de las válidas`,
        });
      }
      criteria.pathology = pathology.toUpperCase();
    }

    // Obtener casos (sin configuración experta)
    const cases = await getClinicalCase(undefined, criteria, false);

    if (!cases || (Array.isArray(cases) && cases.length === 0)) {
      return res.status(200).json({
        cases: [],
        pagination: {
          limit,
          offset,
          total: 0,
        },
      });
    }

    const casesArray = Array.isArray(cases) ? cases : [cases];

    // Obtener total de casos (para paginación)
    const where: any = { isActive: true };
    if (difficulty) {
      where.difficulty = difficulty.toUpperCase();
    }
    if (pathology) {
      where.pathology = pathology.toUpperCase();
    }

    const total = await prisma.clinicalCase.count({ where });

    // Obtener información de intentos del usuario para cada caso
    const caseIds = casesArray.map(c => c.id);
    const userAttempts = await prisma.evaluationAttempt.findMany({
      where: {
        userId,
        clinicalCaseId: { in: caseIds },
      },
      select: {
        clinicalCaseId: true,
        score: true,
        isSuccessful: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    // Crear mapa de intentos por caso
    const attemptsMap = new Map(
      userAttempts.map(attempt => [
        attempt.clinicalCaseId,
        {
          hasAttempted: true,
          bestScore: Math.max(...userAttempts.filter(a => a.clinicalCaseId === attempt.clinicalCaseId).map(a => a.score)),
          lastAttempt: attempt.completedAt,
          isSuccessful: attempt.isSuccessful,
        },
      ])
    );

    // Agregar información de intentos a cada caso
    const casesWithAttempts = casesArray.map(caseData => ({
      id: caseData.id,
      title: caseData.title,
      description: caseData.description,
      patientAge: caseData.patientAge,
      patientWeight: caseData.patientWeight,
      mainDiagnosis: caseData.mainDiagnosis,
      comorbidities: caseData.comorbidities,
      difficulty: caseData.difficulty,
      pathology: caseData.pathology,
      educationalGoal: caseData.educationalGoal,
      userAttempts: attemptsMap.get(caseData.id) || {
        hasAttempted: false,
        bestScore: null,
        lastAttempt: null,
        isSuccessful: false,
      },
    }));

    // Log de consulta
    console.log(`[${new Date().toISOString()}] Usuario ${userId} consultó casos clínicos (filtros: ${JSON.stringify(criteria)})`);

    res.status(200).json({
      cases: casesWithAttempts,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener casos clínicos:', error);
    res.status(500).json({
      error: 'Error al obtener casos',
      message: 'Ocurrió un error al consultar los casos clínicos',
    });
  }
};

/**
 * GET /api/cases/:caseId
 * Obtener información completa de un caso clínico
 */
export const getCaseById = async (req: Request, res: Response) => {
  try {
    setResponseHeaders(res);

    const userId = req.user?.id;
    const { caseId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para ver casos clínicos',
      });
    }

    if (!caseId) {
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'El ID del caso es requerido',
      });
    }

    // Obtener caso (sin configuración experta)
    const caseData = await getClinicalCase(caseId, undefined, false);

    if (!caseData || Array.isArray(caseData)) {
      return res.status(404).json({
        error: 'Caso no encontrado',
        message: 'El caso clínico especificado no existe',
      });
    }

    // Verificar que el caso esté activo
    if (!caseData.expertConfiguration) {
      // Verificar en BD si está activo
      const caseInDb = await prisma.clinicalCase.findUnique({
        where: { id: caseId },
        select: { isActive: true },
      });

      if (!caseInDb || !caseInDb.isActive) {
        return res.status(403).json({
          error: 'Caso no disponible',
          message: 'Este caso clínico no está disponible',
        });
      }
    }

    // Obtener intentos del usuario en este caso
    const userAttempts = await prisma.evaluationAttempt.findMany({
      where: {
        userId,
        clinicalCaseId: caseId,
      },
      select: {
        id: true,
        score: true,
        isSuccessful: true,
        completedAt: true,
        startedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 5, // Últimos 5 intentos
    });

    const bestAttempt = userAttempts.length > 0
      ? userAttempts.reduce((best, current) => 
          current.score > best.score ? current : best
        )
      : null;

    const response = {
      case: {
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
      },
      userAttempts: {
        total: userAttempts.length,
        bestScore: bestAttempt?.score || null,
        lastAttempt: userAttempts[0]?.completedAt || null,
        attempts: userAttempts.map(attempt => ({
          id: attempt.id,
          score: attempt.score,
          isSuccessful: attempt.isSuccessful,
          completedAt: attempt.completedAt,
        })),
      },
    };

    // Log de acceso
    console.log(`[${new Date().toISOString()}] Usuario ${userId} accedió a caso ${caseId}`);

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error al obtener caso clínico:', error);
    
    if (error.message?.includes('no encontrado') || error.message?.includes('no existe')) {
      return res.status(404).json({
        error: 'Caso no encontrado',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Error al obtener caso',
      message: 'Ocurrió un error al consultar el caso clínico',
    });
  }
};

/**
 * POST /api/cases/:caseId/evaluate
 * Evaluar configuración del usuario
 */
export const evaluateCase = async (req: Request, res: Response) => {
  try {
    setResponseHeaders(res);

    const userId = req.user?.id;
    const { caseId } = req.params;
    const startTime = Date.now();

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para evaluar casos',
      });
    }

    // Verificar rate limiting
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes',
        message: `Has excedido el límite de solicitudes. Intenta nuevamente en ${rateLimitCheck.retryAfter} segundos.`,
        retryAfter: rateLimitCheck.retryAfter,
      });
    }

    if (!caseId) {
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'El ID del caso es requerido',
      });
    }

    // Validar configuración del usuario
    const userConfig: UserConfiguration = req.body.configuration || req.body;

    if (!userConfig) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'La configuración del ventilador es requerida',
      });
    }

    // Validar parámetros requeridos
    if (!userConfig.ventilationMode) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'El modo de ventilación es requerido',
      });
    }

    // Validar tipos de datos
    const validationErrors: string[] = [];

    if (userConfig.tidalVolume !== undefined && (typeof userConfig.tidalVolume !== 'number' || userConfig.tidalVolume < 0)) {
      validationErrors.push('Volumen Tidal debe ser un número positivo');
    }

    if (userConfig.respiratoryRate !== undefined && (typeof userConfig.respiratoryRate !== 'number' || userConfig.respiratoryRate < 0)) {
      validationErrors.push('Frecuencia Respiratoria debe ser un número positivo');
    }

    if (userConfig.peep !== undefined && (typeof userConfig.peep !== 'number' || userConfig.peep < 0)) {
      validationErrors.push('PEEP debe ser un número positivo');
    }

    if (userConfig.fio2 !== undefined && (typeof userConfig.fio2 !== 'number' || userConfig.fio2 < 0 || userConfig.fio2 > 100)) {
      validationErrors.push('FiO2 debe ser un número entre 0 y 100');
    }

    if (userConfig.maxPressure !== undefined && (typeof userConfig.maxPressure !== 'number' || userConfig.maxPressure < 0)) {
      validationErrors.push('Presión Máxima debe ser un número positivo');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'Errores en la configuración',
        errors: validationErrors,
      });
    }

    // Obtener caso clínico con configuración experta
    const caseData = await getClinicalCase(caseId, undefined, true);

    if (!caseData || Array.isArray(caseData)) {
      return res.status(404).json({
        error: 'Caso no encontrado',
        message: 'El caso clínico especificado no existe',
      });
    }

    if (!caseData.expertConfiguration) {
      return res.status(500).json({
        error: 'Configuración experta no disponible',
        message: 'El caso no tiene configuración experta asociada',
      });
    }

    // Comparar configuraciones
    const comparison = await compareConfigurations(userConfig, caseData.expertConfiguration);

    // Generar retroalimentación con IA
    const feedback = await generateFeedback(
      caseData,
      userConfig,
      caseData.expertConfiguration,
      comparison
    );

    // Calcular tiempo de completitud
    const completionTime = Math.floor((Date.now() - startTime) / 1000); // En segundos

    // Guardar intento
    const attempt = await saveEvaluationAttempt(
      userId,
      caseId,
      userConfig,
      comparison.score,
      comparison,
      feedback.feedback,
      completionTime
    );

    // Obtener intentos anteriores para mostrar mejora
    const previousAttempts = await prisma.evaluationAttempt.findMany({
      where: {
        userId,
        clinicalCaseId: caseId,
        id: { not: attempt.id },
      },
      select: {
        score: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 1,
    });

    const previousScore = previousAttempts.length > 0 ? previousAttempts[0].score : null;
    const improvement = previousScore !== null
      ? comparison.score - previousScore
      : null;

    const response = {
      success: true,
      attempt: {
        id: attempt.id,
        score: comparison.score,
        isSuccessful: attempt.isSuccessful,
        completionTime,
      },
      comparison: {
        score: comparison.score,
        totalParameters: comparison.totalParameters,
        correctParameters: comparison.correctParameters,
        summary: comparison.summary,
        parameters: comparison.parameters.map(p => ({
          parameter: p.parameter,
          userValue: p.userValue,
          expertValue: p.expertValue,
          difference: p.difference,
          differencePercent: p.differencePercent,
          withinRange: p.withinRange,
          errorClassification: p.errorClassification,
          priority: p.priority,
        })),
        criticalErrors: comparison.criticalErrors,
      },
      feedback: {
        text: feedback.feedback,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        recommendations: feedback.recommendations,
        safetyConcerns: feedback.safetyConcerns,
      },
      expertConfiguration: {
        ventilationMode: caseData.expertConfiguration.ventilationMode,
        tidalVolume: caseData.expertConfiguration.tidalVolume,
        respiratoryRate: caseData.expertConfiguration.respiratoryRate,
        peep: caseData.expertConfiguration.peep,
        fio2: caseData.expertConfiguration.fio2,
        maxPressure: caseData.expertConfiguration.maxPressure,
        iERatio: caseData.expertConfiguration.iERatio,
        justification: caseData.expertConfiguration.justification,
      },
      improvement: improvement !== null ? {
        previousScore,
        currentScore: comparison.score,
        difference: improvement,
        improved: improvement > 0,
      } : null,
    };

    // Log de evaluación
    console.log(`[${new Date().toISOString()}] Usuario ${userId} evaluó caso ${caseId}. Score: ${comparison.score}, Tiempo: ${completionTime}s`);

    if (comparison.criticalErrors.length > 0) {
      console.log(`[${new Date().toISOString()}] Usuario ${userId} tiene ${comparison.criticalErrors.length} error(es) crítico(s) en caso ${caseId}`);
    }

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error al evaluar caso:', error);
    
    if (error.message?.includes('no encontrado') || error.message?.includes('no existe')) {
      return res.status(404).json({
        error: 'Caso no encontrado',
        message: error.message,
      });
    }

    if (error.message?.includes('Validación') || error.message?.includes('Datos incompletos')) {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Error al evaluar caso',
      message: 'Ocurrió un error al procesar la evaluación',
    });
  }
};

/**
 * GET /api/cases/:caseId/attempts
 * Obtener historial de intentos del usuario en un caso
 */
export const getCaseAttempts = async (req: Request, res: Response) => {
  try {
    setResponseHeaders(res);

    const userId = req.user?.id;
    const { caseId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para ver intentos',
      });
    }

    if (!caseId) {
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'El ID del caso es requerido',
      });
    }

    // Validar que el caso existe
    const caseExists = await prisma.clinicalCase.findUnique({
      where: { id: caseId },
      select: { id: true, title: true },
    });

    if (!caseExists) {
      return res.status(404).json({
        error: 'Caso no encontrado',
        message: 'El caso clínico especificado no existe',
      });
    }

    // Obtener intentos del usuario
    const attempts = await prisma.evaluationAttempt.findMany({
      where: {
        userId,
        clinicalCaseId: caseId,
      },
      select: {
        id: true,
        score: true,
        isSuccessful: true,
        completionTime: true,
        completedAt: true,
        startedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    // Calcular estadísticas
    const stats = {
      total: attempts.length,
      successful: attempts.filter(a => a.isSuccessful).length,
      bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null,
      averageScore: attempts.length > 0
        ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
        : null,
      averageTime: attempts.length > 0 && attempts.some(a => a.completionTime)
        ? attempts
            .filter(a => a.completionTime)
            .reduce((sum, a) => sum + (a.completionTime || 0), 0) / attempts.filter(a => a.completionTime).length
        : null,
    };

    // Calcular mejora entre intentos
    const attemptsWithImprovement = attempts.map((attempt, index) => {
      if (index === 0) {
        return {
          ...attempt,
          improvement: null,
        };
      }

      const previousScore = attempts[index - 1].score;
      const improvement = attempt.score - previousScore;

      return {
        ...attempt,
        improvement: {
          previousScore,
          difference: improvement,
          improved: improvement > 0,
        },
      };
    });

    const response = {
      case: {
        id: caseExists.id,
        title: caseExists.title,
      },
      stats,
      attempts: attemptsWithImprovement,
    };

    // Log de consulta
    console.log(`[${new Date().toISOString()}] Usuario ${userId} consultó intentos del caso ${caseId}`);

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error al obtener intentos:', error);
    
    if (error.message?.includes('no encontrado') || error.message?.includes('no existe')) {
      return res.status(404).json({
        error: 'Caso no encontrado',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Error al obtener intentos',
      message: 'Ocurrió un error al consultar los intentos',
    });
  }
};

export default {
  getCases,
  getCaseById,
  evaluateCase,
  getCaseAttempts,
};


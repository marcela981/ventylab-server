import { LevelInfo } from '../../types/progress';

/**
 * Tabla de niveles y XP requerido
 * Fórmula: XP requerido = nivel * 100 * (nivel / 2)
 * Esto crea una progresión exponencial suave
 */
const LEVEL_TABLE: Array<{ level: number; xpRequired: number }> = [];

// Generar tabla de niveles hasta nivel 100
for (let level = 1; level <= 100; level++) {
  const xpRequired = Math.floor(level * 100 * (level / 2));
  LEVEL_TABLE.push({ level, xpRequired });
}

/**
 * Calcular el nivel del usuario basado en XP
 */
export async function calculateLevel(totalXP: number): Promise<LevelInfo> {
  if (totalXP < 0) {
    return {
      level: 1,
      xpRequired: 0,
      xpCurrent: 0,
      xpToNext: LEVEL_TABLE[0].xpRequired,
      progressToNext: 0,
    };
  }

  // Encontrar el nivel actual
  let currentLevel = 1;
  let xpForCurrentLevel = 0;
  let xpForNextLevel = LEVEL_TABLE[0].xpRequired;

  for (let i = 0; i < LEVEL_TABLE.length; i++) {
    if (totalXP >= LEVEL_TABLE[i].xpRequired) {
      currentLevel = LEVEL_TABLE[i].level;
      xpForCurrentLevel = LEVEL_TABLE[i].xpRequired;
      xpForNextLevel = i < LEVEL_TABLE.length - 1
        ? LEVEL_TABLE[i + 1].xpRequired
        : LEVEL_TABLE[i].xpRequired;
    } else {
      break;
    }
  }

  // Si está en el nivel máximo
  if (currentLevel >= 100) {
    return {
      level: 100,
      xpRequired: LEVEL_TABLE[99].xpRequired,
      xpCurrent: totalXP,
      xpToNext: 0,
      progressToNext: 100,
    };
  }

  const xpCurrent = totalXP - xpForCurrentLevel;
  const xpToNext = xpForNextLevel - totalXP;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const progressToNext = xpNeededForNext > 0
    ? (xpCurrent / xpNeededForNext) * 100
    : 100;

  return {
    level: currentLevel,
    xpRequired: xpForCurrentLevel,
    xpCurrent,
    xpToNext,
    progressToNext: Math.round(progressToNext * 100) / 100,
  };
}

/**
 * Determinar cuánto XP falta para el siguiente nivel
 */
export async function getXPToNextLevel(totalXP: number): Promise<number> {
  const levelInfo = await calculateLevel(totalXP);
  return levelInfo.xpToNext;
}

/**
 * Evaluar el nivel apropiado del usuario según su progreso
 * Esta función puede ajustar el nivel basado en diferentes factores
 */
export async function evaluateUserLevel(
  totalXP: number,
  completedLessons: number,
  completedModules: number,
  passedQuizzes: number
): Promise<LevelInfo> {
  // Calcular nivel base por XP
  const baseLevelInfo = await calculateLevel(totalXP);

  // Ajustes basados en otros factores (opcional)
  // Por ahora, solo usamos XP
  // En el futuro se podría considerar:
  // - Lecciones completadas
  // - Módulos completados
  // - Quizzes pasados
  // - Tiempo de estudio

  return baseLevelInfo;
}

/**
 * Obtener información de un nivel específico
 */
export function getLevelInfo(level: number): { level: number; xpRequired: number } | null {
  if (level < 1 || level > 100) {
    return null;
  }
  return LEVEL_TABLE[level - 1] || null;
}

/**
 * Obtener todos los niveles (útil para mostrar progresión)
 */
export function getAllLevels(): Array<{ level: number; xpRequired: number }> {
  return LEVEL_TABLE;
}

export default {
  calculateLevel,
  getXPToNextLevel,
  evaluateUserLevel,
  getLevelInfo,
  getAllLevels,
};


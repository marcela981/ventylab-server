/**
 * VentyLab Curriculum Seed Script
 * ================================
 * One-time migration that makes the database the SINGLE source of truth.
 *
 * Sources: Frontend curriculumData.js + lesson JSON files
 * Targets: Level → Module → Lesson (+ prerequisites)
 *
 * SAFE TO RE-RUN: Uses TRUNCATE CASCADE then re-inserts.
 * NEVER TOUCHES: users, accounts, sessions, quizzes, clinical_cases, etc.
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// 1. DATA DEFINITIONS
// ============================================

// --- LEVELS ---
const LEVELS = [
  {
    id: 'level-prerequisitos',
    title: 'Prerequisitos',
    track: 'mecanica',
    description: 'Contenido fundamental opcional para reforzar bases antes de iniciar el currículo principal',
    order: 1,
  },
  {
    id: 'level-beginner',
    title: 'Nivel Principiante',
    track: 'mecanica',
    description: 'Fundamentos fisiológicos y conceptos básicos de ventilación mecánica',
    order: 2,
  },
  {
    id: 'level-intermedio',
    title: 'Nivel Intermedio',
    track: 'mecanica',
    description: 'Modalidades ventilatorias y manejo de parámetros críticos',
    order: 3,
  },
  {
    id: 'level-avanzado',
    title: 'Nivel Avanzado',
    track: 'mecanica',
    description: 'Estrategias especializadas y casos clínicos complejos',
    order: 4,
  },
  // --- VENTYLAB TRACK ---
  {
    id: 'ventylab-principiante',
    title: 'Principiante',
    track: 'ventylab',
    description: 'Primeros pasos con la plataforma: navegación, simulador y configuración básica',
    order: 1,
  },
  {
    id: 'ventylab-intermedio',
    title: 'Intermedio',
    track: 'ventylab',
    description: 'Interpretación de datos del simulador y uso de casos clínicos',
    order: 2,
  },
  {
    id: 'ventylab-avanzado',
    title: 'Avanzado',
    track: 'ventylab',
    description: 'Escenarios complejos, evaluación y personalización del flujo de trabajo',
    order: 3,
  },
];

// --- MODULES WITH EMBEDDED LESSONS ---
// IMPORTANT: Module IDs and Lesson IDs must match the frontend curriculum data
// (curriculumData.js / ensenanzaRespiratoria/modules.js). This alignment is required
// for progress tracking: the frontend sends lessonId=<curriculum lesson id> and
// moduleId=<curriculum module id> to /api/progress/step/update. The backend
// resolveIdsForProgress() resolves those IDs via the Lesson table (Step 1 direct lookup).
interface LessonDef {
  id: string;
  title: string;
  slug: string;
  order: number;
  estimatedTime: number;
}

interface ModuleDef {
  id: string;
  levelId: string;
  title: string;
  description: string;
  difficulty: string;
  order: number;
  estimatedTime: number;
  category?: string;
  lessons: LessonDef[];
}

const MODULES: ModuleDef[] = [
  // ========================================
  // PREREQUISITOS (2 modules, 5 lessons)
  // ========================================
  {
    id: 'respiratory-physiology',
    levelId: 'level-prerequisitos',
    title: 'Fisiología Respiratoria',
    description: 'Principios del intercambio gaseoso, mecánica ventilatoria y difusión',
    difficulty: 'prerequisitos',
    order: 1,
    estimatedTime: 150,
    lessons: [
      { id: 'rp-inversion-fisiologica', title: 'La Inversión Fisiológica (Fundamentos)', slug: 'inversion-fisiologica', order: 1, estimatedTime: 45 },
      { id: 'rp-ecuacion-movimiento', title: 'Ecuación de Movimiento (Fundamentos)', slug: 'ecuacion-movimiento', order: 2, estimatedTime: 50 },
      { id: 'rp-variables-fase', title: 'Variables de Fase (Fundamentos)', slug: 'variables-fase', order: 3, estimatedTime: 54 },
    ],
  },
  {
    id: 'ventilation-principles',
    levelId: 'level-prerequisitos',
    title: 'Principios de Ventilación Mecánica',
    description: 'Indicaciones, objetivos y parámetros básicos de configuración del ventilador',
    difficulty: 'prerequisitos',
    order: 2,
    estimatedTime: 65,
    lessons: [
      { id: 'vm-indications', title: 'Indicaciones de Ventilación Mecánica', slug: 'indicaciones-vm', order: 1, estimatedTime: 25 },
      { id: 'basic-parameters', title: 'Parámetros Ventilatorios Básicos', slug: 'parametros-basicos', order: 2, estimatedTime: 40 },
    ],
  },

  // ========================================
  // BEGINNER (6 modules, 1 lesson each — mirrors level01-principiante JSON files)
  // Module IDs = Lesson IDs so resolveIdsForProgress can resolve them via direct
  // Lesson lookup.  Frontend sends lessonId = moduleId = e.g. 'module-01-inversion-fisiologica'.
  // ========================================
  {
    id: 'module-01-inversion-fisiologica',
    levelId: 'level-beginner',
    title: 'La Inversión Fisiológica: De la Presión Negativa a la Positiva',
    description: 'Fundamentos del paso de la respiración espontánea a la ventilación mecánica con presión positiva.',
    difficulty: 'beginner',
    order: 1,
    estimatedTime: 211,
    lessons: [
      { id: 'module-01-inversion-fisiologica', title: 'La Inversión Fisiológica: De la Presión Negativa a la Positiva', slug: 'inversion-fisiologica', order: 1, estimatedTime: 211 },
    ],
  },
  {
    id: 'module-02-ecuacion-movimiento',
    levelId: 'level-beginner',
    title: 'El Santo Grial – La Ecuación del Movimiento Respiratorio',
    description: 'La ecuación fundamental que gobierna la interacción ventilador-pulmón.',
    difficulty: 'beginner',
    order: 2,
    estimatedTime: 50,
    lessons: [
      { id: 'module-02-ecuacion-movimiento', title: 'El Santo Grial – La Ecuación del Movimiento Respiratorio', slug: 'ecuacion-movimiento', order: 1, estimatedTime: 50 },
    ],
  },
  {
    id: 'module-03-variables-fase',
    levelId: 'level-beginner',
    title: 'Variables de Fase y el Ciclo Respiratorio',
    description: 'La lógica del ventilador: cómo las variables de fase determinan el ciclo respiratorio.',
    difficulty: 'beginner',
    order: 3,
    estimatedTime: 54,
    lessons: [
      { id: 'module-03-variables-fase', title: 'La Lógica de la Máquina: Variables de Fase y el Ciclo Respiratorio', slug: 'variables-fase', order: 1, estimatedTime: 54 },
    ],
  },
  {
    id: 'module-04-modos-ventilatorios',
    levelId: 'level-beginner',
    title: 'Taxonomía de los Modos Ventilatorios',
    description: 'Clasificación y selección de modos ventilatorios: volumen vs. presión, control vs. asistencia.',
    difficulty: 'beginner',
    order: 4,
    estimatedTime: 114,
    lessons: [
      { id: 'module-04-modos-ventilatorios', title: 'Taxonomía de los Modos: Volumen vs. Presión (Control y Asistencia)', slug: 'modos-ventilatorios', order: 1, estimatedTime: 114 },
    ],
  },
  {
    id: 'module-05-monitorizacion-grafica',
    levelId: 'level-beginner',
    title: 'Monitorización Gráfica I: Escalares y Bucles',
    description: 'Interpretación de curvas gráficas del ventilador e identificación de asincronías básicas.',
    difficulty: 'beginner',
    order: 5,
    estimatedTime: 480,
    lessons: [
      { id: 'module-05-monitorizacion-grafica', title: 'Monitorización Gráfica I: Escalares, Bucles y Asincronías básicas', slug: 'monitorizacion-grafica', order: 1, estimatedTime: 480 },
    ],
  },
  {
    id: 'module-06-efectos-sistemicos',
    levelId: 'level-beginner',
    title: 'Efectos Sistémicos y VILI',
    description: 'Efectos sistémicos de la presión positiva y estrategias para prevenir la lesión pulmonar por ventilación (VILI).',
    difficulty: 'beginner',
    order: 6,
    estimatedTime: 600,
    lessons: [
      { id: 'module-06-efectos-sistemicos', title: 'Efectos Sistémicos y Lesión Inducida por la Ventilación (VILI)', slug: 'efectos-sistemicos', order: 1, estimatedTime: 600 },
    ],
  },

  // ========================================
  // INTERMEDIATE (6 modules, 1 lesson each — mirrors level02-intermedio JSON files)
  // ========================================
  {
    id: 'module-01-vcv-vs-pcv',
    levelId: 'level-intermedio',
    title: 'VCV vs PCV en el Paciente de Alta Complejidad',
    description: 'Selección estratégica del modo ventilatorio en el paciente crítico obeso: fisiopatología, análisis comparativo VCV/PCV, programación por peso predicho y optimización de PEEP',
    difficulty: 'intermediate',
    order: 1,
    estimatedTime: 75,
    lessons: [
      { id: 'lesson-vcv-vs-pcv', title: 'Ventilación por Control de Volumen (VCV) vs. Control de Presión (PCV) en el Paciente de Alta Complejidad', slug: 'vcv-vs-pcv', order: 1, estimatedTime: 75 },
    ],
  },
  {
    id: 'module-02-peep-optimizar-oxigenacion',
    levelId: 'level-intermedio',
    title: 'PEEP: Fisiopatología y Optimización de la Oxigenación',
    description: 'Fisiopatología de PEEP extrínseca e intrínseca en el paciente obeso, estrategias de optimización del intercambio gaseoso y maniobras de reclutamiento alveolar',
    difficulty: 'intermediate',
    order: 2,
    estimatedTime: 80,
    lessons: [
      { id: 'lesson-peep-optimizar-oxigenacion', title: 'PEEP: fisiopatología y optimización de la oxigenación en el paciente obeso', slug: 'peep-optimizar-oxigenacion', order: 1, estimatedTime: 80 },
    ],
  },
  {
    id: 'module-03-soporte-psv-cpap',
    levelId: 'level-intermedio',
    title: 'Soporte Ventilatorio: PSV, CPAP y Protección Pulmonar',
    description: 'Gestión ventilatoria del paciente obeso integrando PSV, CPAP postoperatorio y estrategias de protección pulmonar con titulación de PEEP y maniobras de reclutamiento',
    difficulty: 'intermediate',
    order: 3,
    estimatedTime: 75,
    lessons: [
      { id: 'lesson-soporte-psv-cpap', title: 'Soporte ventilatorio en el paciente obeso: PSV, CPAP y estrategias de protección pulmonar', slug: 'soporte-psv-cpap', order: 1, estimatedTime: 75 },
    ],
  },
  {
    id: 'module-04-duales-simv',
    levelId: 'level-intermedio',
    title: 'Modos Duales y SIMV: Fisiopatología Avanzada',
    description: 'Fundamentos fisiopatológicos del paciente crítico obeso con estrategias de ventilación protectora y marcos pedagógicos de andamiaje para competencia clínica autónoma',
    difficulty: 'intermediate',
    order: 4,
    estimatedTime: 80,
    lessons: [
      { id: 'lesson-duales-simv', title: 'Modos duales y SIMV: fisiopatología avanzada, ventilación protectora y andamiaje pedagógico', slug: 'duales-simv', order: 1, estimatedTime: 80 },
    ],
  },
  {
    id: 'module-05-graficas-fine-tuning',
    levelId: 'level-intermedio',
    title: 'Monitorización Gráfica y Fine Tuning',
    description: 'Monitorización gráfica de precisión y ajuste fino del ventilador en el paciente obeso: Driving Pressure, maniobras de reclutamiento y titulación de PEEP decremental',
    difficulty: 'intermediate',
    order: 5,
    estimatedTime: 80,
    lessons: [
      { id: 'lesson-graficas-fine-tuning', title: 'Monitorización gráfica y Fine Tuning en el paciente con obesidad', slug: 'graficas-fine-tuning', order: 1, estimatedTime: 80 },
    ],
  },
  {
    id: 'module-06-avanzado-evaluacion-destete',
    levelId: 'level-intermedio',
    title: 'Mecánicas Avanzadas y Evaluación para el Destete',
    description: 'Fisiopatología restrictiva extrapulmonar avanzada con estrategias de protección alveolar basadas en evidencia (PROBESE, IMPROVE, LOV-ED) y evaluación para el destete',
    difficulty: 'intermediate',
    order: 6,
    estimatedTime: 85,
    lessons: [
      { id: 'lesson-avanzado-evaluacion-destete', title: 'Mecánicas avanzadas y evaluación para el destete en el paciente obeso', slug: 'avanzado-evaluacion-destete', order: 1, estimatedTime: 85 },
    ],
  },

  // ========================================
  // VENTYLAB PRINCIPIANTE (2 modules, 2 lessons)
  // ========================================
  {
    id: 'ventylab-module-01-historia-fisiologia',
    levelId: 'ventylab-principiante',
    title: 'Historia y Fisiología Aplicada',
    description: 'Historia de la educación médica y fisiología aplicada al aprendizaje: SDL/TBL y estrategias de recuperación espaciada',
    difficulty: 'beginner',
    order: 1,
    estimatedTime: 75,
    lessons: [
      { id: 'vl-historia-fisiologia-aplicada', title: 'Historia y fisiología aplicada: SDL/TBL y estrategias de recuperación', slug: 'historia-fisiologia-aplicada', order: 1, estimatedTime: 75 },
    ],
  },
  {
    id: 'ventylab-module-02-ventilador-componentes',
    levelId: 'ventylab-principiante',
    title: 'El Ventilador y sus Componentes',
    description: 'Aprendizaje autodirigido con SDL/TBL usando la metáfora del ventilador: autonomía, lectura activa, recuperación espaciada y soporte colaborativo',
    difficulty: 'beginner',
    order: 2,
    estimatedTime: 70,
    lessons: [
      { id: 'vl-ventilador-componentes', title: 'El Ventilador y sus Componentes: Aprendizaje autodirigido con SDL/TBL', slug: 'ventilador-componentes', order: 1, estimatedTime: 70 },
    ],
  },

  // ========================================
  // VENTYLAB INTERMEDIO (2 modules, 2 lessons)
  // ========================================
  {
    id: 'ventylab-module-03-programacion-modos',
    levelId: 'ventylab-intermedio',
    title: 'Programación de Modos Clásicos',
    description: 'Arquitectura del aprendizaje activo y estructuración con JSON: recuperación, memoria y estandarización para interoperabilidad con herramientas como Anki y flujos TBL',
    difficulty: 'intermediate',
    order: 1,
    estimatedTime: 65,
    lessons: [
      { id: 'vl-programacion-modos-clasicos', title: 'Arquitectura del Aprendizaje Activo y Estructuración con JSON (Programación de modos clásicos)', slug: 'programacion-modos-clasicos', order: 1, estimatedTime: 65 },
    ],
  },
  {
    id: 'ventylab-module-04-vni-destete',
    levelId: 'ventylab-intermedio',
    title: 'Ventilación No Invasiva y Destete',
    description: 'Guía maestra de estrategias de aprendizaje para VNI y destete: SDL, neurobiología de la memoria, lectura activa, recuperación espaciada y TBL/simulación',
    difficulty: 'intermediate',
    order: 2,
    estimatedTime: 68,
    lessons: [
      { id: 'vl-vni-destete', title: 'Guía maestra de estrategias de aprendizaje para ventilación no invasiva y destete', slug: 'vni-destete', order: 1, estimatedTime: 68 },
    ],
  },

  // ========================================
  // VENTYLAB AVANZADO (2 modules, 2 lessons)
  // ========================================
  {
    id: 'ventylab-module-05-raciocinio-clinico',
    levelId: 'ventylab-avanzado',
    title: 'Raciocinio Clínico en Patologías Críticas',
    description: 'Fundamentos neurobiológicos del juicio clínico, lectura activa, recuperación espaciada, TBL/simulación y gestión de protocolos con JSON para patologías críticas',
    difficulty: 'advanced',
    order: 1,
    estimatedTime: 72,
    lessons: [
      { id: 'vl-raciocinio-clinico-patologias', title: 'Raciocinio clínico en patologías críticas: neurobiología, recuperación y arquitectura de datos', slug: 'raciocinio-clinico-patologias', order: 1, estimatedTime: 72 },
    ],
  },
  {
    id: 'ventylab-module-06-innovacion-tecnologia',
    levelId: 'ventylab-avanzado',
    title: 'Innovación, Tecnología y Gestión del Aprendizaje',
    description: 'Neurobiología del aprendizaje, lectura activa, recuperación espaciada, Anki, TBL, simulación y gestión técnica con JSON/Python/jq para una práctica clínica eficiente y escalable',
    difficulty: 'advanced',
    order: 2,
    estimatedTime: 88,
    lessons: [
      { id: 'vl-innovacion-tecnologia-gestion', title: 'Innovación, tecnología y gestión del aprendizaje clínico', slug: 'innovacion-tecnologia-gestion', order: 1, estimatedTime: 88 },
    ],
  },

  // ========================================
  // ADVANCED (8 modules, 1 lesson each — mirrors level03-avanzado JSON files)
  // ========================================
  {
    id: 'module-01-vili-ventilacion-protectora',
    levelId: 'level-avanzado',
    title: 'VILI y Ventilación Protectora en el Paciente con Obesidad',
    description: 'Síntesis de la interacción entre obesidad y mecánica ventilatoria para mitigar VILI: fisiopatología restrictiva, programación por PBW, titulación LOV-ED y gestión postoperatoria',
    difficulty: 'advanced',
    order: 1,
    estimatedTime: 85,
    lessons: [
      { id: 'lesson-vili-ventilacion-protectora', title: 'VILI y ventilación protectora en el paciente con obesidad', slug: 'vili-ventilacion-protectora', order: 1, estimatedTime: 85 },
    ],
  },
  {
    id: 'module-02-monitorizacion-alto-nivel',
    levelId: 'level-avanzado',
    title: 'Monitorización de Alto Nivel: Driving Pressure y Poder Mecánico',
    description: 'Monitorización dinámica de Driving Pressure como predictor de protección pulmonar, titulación granular de PEEP y concepto de Poder Mecánico como suma de vectores de lesión',
    difficulty: 'advanced',
    order: 2,
    estimatedTime: 90,
    lessons: [
      { id: 'lesson-monitorizacion-alto-nivel', title: 'Monitorización de alto nivel: Driving Pressure y Poder Mecánico', slug: 'monitorizacion-alto-nivel', order: 1, estimatedTime: 90 },
    ],
  },
  {
    id: 'module-03-advertencias-asincronias',
    levelId: 'level-avanzado',
    title: 'Advertencias, Asincronías y Situaciones Complejas',
    description: 'Resolución de situaciones complejas: detección de asincronías por PEEPi, programación avanzada, MR progresiva en escalera y optimización cognitiva avanzada',
    difficulty: 'advanced',
    order: 3,
    estimatedTime: 90,
    lessons: [
      { id: 'lesson-advertencias-asincronias', title: 'Advertencias, asincronías y resolución de situaciones complejas', slug: 'advertencias-asincronias', order: 1, estimatedTime: 90 },
    ],
  },
  {
    id: 'module-04-destete-complejo-vmni',
    levelId: 'level-avanzado',
    title: 'Destete Ventilatorio Complejo y VMNI en el Paciente con Obesidad',
    description: 'Destete complejo del paciente obeso crítico: fisiopatología restrictiva, evidencia PROBESE/PROVHILO/IMPROVE, rebote REM de AOS, VMNI/CPAP profiláctica y detección de SDRA postoperatorio',
    difficulty: 'advanced',
    order: 4,
    estimatedTime: 90,
    lessons: [
      { id: 'lesson-destete-complejo-vmni', title: 'Destete ventilatorio complejo y uso de VMNI en el paciente con obesidad', slug: 'destete-complejo-vmni', order: 1, estimatedTime: 90 },
    ],
  },
  {
    id: 'module-05-obesidad-sedentarismo',
    levelId: 'level-avanzado',
    category: 'pathologies',
    title: 'Ventilación en Obesidad y Sedentarismo: Patologías Avanzadas',
    description: 'Epidemiología crítica de la obesidad, mecánica vertical vs. supino, programación con PBW, gestión avanzada de PEEP y comorbilidades AOS/SDRA con 5 Recomendaciones de Oro',
    difficulty: 'advanced',
    order: 5,
    estimatedTime: 90,
    lessons: [
      { id: 'lesson-obesidad-sedentarismo', title: 'Ventilación en el paciente con obesidad y sedentarismo: perspectiva de patologías avanzadas', slug: 'obesidad-sedentarismo', order: 1, estimatedTime: 90 },
    ],
  },
  {
    id: 'module-06-epoc-asma-fumadores',
    levelId: 'level-avanzado',
    category: 'pathologies',
    title: 'Estrategias en Enfermedades Obstructivas: EPOC, Asma y Fumadores',
    description: 'Estrategias ventilatorias en enfermedades obstructivas con obesidad: epidemiología OCDE, 5 impactos críticos sobre mecánica pulmonar, tabla LOV-ED y prevención nutricional APEPOC',
    difficulty: 'advanced',
    order: 6,
    estimatedTime: 90,
    lessons: [
      { id: 'lesson-epoc-asma-fumadores', title: 'Estrategias en enfermedades obstructivas: EPOC, asma y fumadores', slug: 'epoc-asma-fumadores', order: 1, estimatedTime: 90 },
    ],
  },
  {
    id: 'module-07-sdra',
    levelId: 'level-avanzado',
    category: 'pathologies',
    title: 'SDRA en el Paciente Obeso: Ventilación Protectora Avanzada',
    description: 'SDRA sobreañadido al paciente obeso: epidemiología OMS/ENSANUT, PEEPi posicional (Pankow et al.), debate PROBESE, controversia FiO₂ >80% y segunda maniobra de reapertura',
    difficulty: 'advanced',
    order: 7,
    estimatedTime: 95,
    lessons: [
      { id: 'lesson-sdra', title: 'SDRA en el paciente obeso: ventilación protectora avanzada y monitoreo de alta precisión', slug: 'sdra', order: 1, estimatedTime: 95 },
    ],
  },
  {
    id: 'module-08-recuperacion-proteccion',
    levelId: 'level-avanzado',
    category: 'pathologies',
    title: 'Protección Extrema: Sinergia entre Fisiología Respiratoria y Arquitectura Cognitiva',
    description: 'Paradigma de protección extrema como personalización absoluta: tabla dual de PEEP LOV-ED vs. Extreme Protection, alerta para mujeres de baja estatura y hábitos APEPOC',
    difficulty: 'advanced',
    order: 8,
    estimatedTime: 95,
    lessons: [
      { id: 'lesson-recuperacion-proteccion', title: 'Protección extrema: sinergia entre fisiología respiratoria y arquitectura cognitiva', slug: 'recuperacion-proteccion', order: 1, estimatedTime: 95 },
    ],
  },
];

// --- LEVEL PREREQUISITES ---
// Each level requires completion of the previous main level
const LEVEL_PREREQUISITES = [
  { levelId: 'level-intermedio', prerequisiteLevelId: 'level-beginner' },
  { levelId: 'level-avanzado', prerequisiteLevelId: 'level-intermedio' },
  // Note: level-prerequisitos has no prerequisites (always accessible)
  // Note: level-beginner has no prerequisites (always accessible)
  // VentyLab track
  { levelId: 'ventylab-intermedio', prerequisiteLevelId: 'ventylab-principiante' },
  { levelId: 'ventylab-avanzado', prerequisiteLevelId: 'ventylab-intermedio' },
];

// --- MODULE PREREQUISITES (within-level sequential chains) ---
const MODULE_PREREQUISITES = [
  // Intermediate mecanica: sequential progression (level02 modules)
  { moduleId: 'module-02-peep-optimizar-oxigenacion', prerequisiteId: 'module-01-vcv-vs-pcv' },
  { moduleId: 'module-03-soporte-psv-cpap', prerequisiteId: 'module-02-peep-optimizar-oxigenacion' },
  { moduleId: 'module-04-duales-simv', prerequisiteId: 'module-03-soporte-psv-cpap' },
  { moduleId: 'module-05-graficas-fine-tuning', prerequisiteId: 'module-04-duales-simv' },
  { moduleId: 'module-06-avanzado-evaluacion-destete', prerequisiteId: 'module-05-graficas-fine-tuning' },
  // Advanced mecanica: sequential progression (level03 modules)
  { moduleId: 'module-02-monitorizacion-alto-nivel', prerequisiteId: 'module-01-vili-ventilacion-protectora' },
  { moduleId: 'module-03-advertencias-asincronias', prerequisiteId: 'module-02-monitorizacion-alto-nivel' },
  { moduleId: 'module-04-destete-complejo-vmni', prerequisiteId: 'module-03-advertencias-asincronias' },
  { moduleId: 'module-05-obesidad-sedentarismo', prerequisiteId: 'module-04-destete-complejo-vmni' },
  { moduleId: 'module-06-epoc-asma-fumadores', prerequisiteId: 'module-05-obesidad-sedentarismo' },
  { moduleId: 'module-07-sdra', prerequisiteId: 'module-06-epoc-asma-fumadores' },
  { moduleId: 'module-08-recuperacion-proteccion', prerequisiteId: 'module-07-sdra' },
  // Beginner: no module prerequisites (sequential access enforced by order)
  // Prerequisitos: no module prerequisites (all accessible)
  // VentyLab Principiante: sequential
  { moduleId: 'ventylab-module-02-ventilador-componentes', prerequisiteId: 'ventylab-module-01-historia-fisiologia' },
  // VentyLab Intermedio: sequential
  { moduleId: 'ventylab-module-04-vni-destete', prerequisiteId: 'ventylab-module-03-programacion-modos' },
  // VentyLab Avanzado: sequential
  { moduleId: 'ventylab-module-06-innovacion-tecnologia', prerequisiteId: 'ventylab-module-05-raciocinio-clinico' },
];

// ============================================
// 2. SEED FUNCTIONS
// ============================================

/**
 * Phase 1: Truncate content tables in FK-safe order.
 * NEVER touches: users, accounts, sessions, quizzes, clinical_cases, etc.
 */
async function truncateContentTables() {
  console.log('\n🗑️  Phase 1: Truncating content tables...');

  // Use raw SQL TRUNCATE CASCADE for PostgreSQL
  // Order matters: children first, then parents
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      lesson_completions,
      user_progress,
      steps,
      lessons,
      module_prerequisites,
      modules,
      level_prerequisites,
      levels
    CASCADE
  `);

  console.log('   ✅ Content tables truncated (progress tables cleared too - no users exist)');
}

/**
 * Phase 2a: Seed levels
 */
async function seedLevels() {
  console.log('\n📚 Phase 2a: Seeding levels...');

  for (const level of LEVELS) {
    await prisma.level.create({
      data: {
        id: level.id,
        title: level.title,
        track: level.track,
        description: level.description,
        order: level.order,
        isActive: true,
      },
    });
    console.log(`   ✅ Level: "${level.title}" (${level.id})`);
  }
}

/**
 * Phase 2b: Seed modules (with levelId FK)
 */
async function seedModules() {
  console.log('\n📖 Phase 2b: Seeding modules...');

  for (const mod of MODULES) {
    await prisma.module.create({
      data: {
        id: mod.id,
        levelId: mod.levelId,
        title: mod.title,
        description: mod.description,
        difficulty: mod.difficulty,
        order: mod.order,
        estimatedTime: mod.estimatedTime,
        category: mod.category ?? null,
        isActive: true,
      },
    });
    console.log(`   ✅ Module: "${mod.title}" → ${mod.levelId} (order: ${mod.order})`);
  }
}

/**
 * Phase 2c: Seed lessons (with moduleId FK and slug)
 */
async function seedLessons() {
  console.log('\n📄 Phase 2c: Seeding lessons...');

  let totalLessons = 0;

  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      await prisma.lesson.create({
        data: {
          id: lesson.id,
          moduleId: mod.id,
          title: lesson.title,
          slug: lesson.slug,
          order: lesson.order,
          estimatedTime: lesson.estimatedTime,
          isActive: true,
        },
      });
      totalLessons++;
    }
    console.log(`   ✅ ${mod.id}: ${mod.lessons.length} lesson(s)`);
  }

  console.log(`   📊 Total lessons created: ${totalLessons}`);
}

/**
 * Phase 2d: Seed level prerequisites
 */
async function seedLevelPrerequisites() {
  console.log('\n🔗 Phase 2d: Seeding level prerequisites...');

  for (const prereq of LEVEL_PREREQUISITES) {
    await prisma.levelPrerequisite.create({
      data: {
        levelId: prereq.levelId,
        prerequisiteLevelId: prereq.prerequisiteLevelId,
      },
    });
    console.log(`   ✅ ${prereq.levelId} requires ${prereq.prerequisiteLevelId}`);
  }
}

/**
 * Phase 2e: Seed module prerequisites
 */
async function seedModulePrerequisites() {
  console.log('\n🔗 Phase 2e: Seeding module prerequisites...');

  for (const prereq of MODULE_PREREQUISITES) {
    await prisma.modulePrerequisite.create({
      data: {
        moduleId: prereq.moduleId,
        prerequisiteId: prereq.prerequisiteId,
      },
    });
    console.log(`   ✅ ${prereq.moduleId} requires ${prereq.prerequisiteId}`);
  }
}

// ============================================
// 3. VALIDATION
// ============================================

async function validate() {
  console.log('\n🔍 Phase 3: Validating...');

  const levelCount = await prisma.level.count();
  const moduleCount = await prisma.module.count();
  const lessonCount = await prisma.lesson.count();
  const levelPrereqCount = await prisma.levelPrerequisite.count();
  const modulePrereqCount = await prisma.modulePrerequisite.count();

  const expectedLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);

  console.log(`   Levels:              ${levelCount} (expected: ${LEVELS.length})`);
  console.log(`   Modules:             ${moduleCount} (expected: ${MODULES.length})`);
  console.log(`   Lessons:             ${lessonCount} (expected: ${expectedLessons})`);
  console.log(`   Level prerequisites: ${levelPrereqCount} (expected: ${LEVEL_PREREQUISITES.length})`);
  console.log(`   Module prerequisites:${modulePrereqCount} (expected: ${MODULE_PREREQUISITES.length})`);

  // Check for orphaned modules (no level)
  const orphanedModules = await prisma.module.count({ where: { levelId: null } });
  if (orphanedModules > 0) {
    console.warn(`   ⚠️  ${orphanedModules} modules have no level assigned!`);
  }

  // Check for orphaned lessons (no module)
  const orphanedLessons = await prisma.lesson.findMany({
    where: { module: { isActive: false } },
    select: { id: true, moduleId: true },
  });
  if (orphanedLessons.length > 0) {
    console.warn(`   ⚠️  ${orphanedLessons.length} lessons belong to inactive modules`);
  }

  // Check modules per level
  for (const level of LEVELS) {
    const count = await prisma.module.count({ where: { levelId: level.id } });
    const expected = MODULES.filter(m => m.levelId === level.id).length;
    const status = count === expected ? '✅' : '❌';
    console.log(`   ${status} ${level.title}: ${count} modules (expected: ${expected})`);
  }

  // Verify no duplicate slugs within same module
  const duplicateSlugs = await prisma.$queryRaw<{ moduleId: string; slug: string; cnt: number }[]>`
    SELECT "moduleId", slug, COUNT(*)::int as cnt
    FROM lessons
    WHERE slug IS NOT NULL
    GROUP BY "moduleId", slug
    HAVING COUNT(*) > 1
  `;
  if (duplicateSlugs.length > 0) {
    console.error('   ❌ Duplicate slugs found:', duplicateSlugs);
  } else {
    console.log('   ✅ No duplicate slugs within modules');
  }

  const allPassed =
    levelCount === LEVELS.length &&
    moduleCount === MODULES.length &&
    lessonCount === expectedLessons &&
    orphanedModules === 0 &&
    duplicateSlugs.length === 0;

  if (allPassed) {
    console.log('\n   🎉 All validations passed!');
  } else {
    console.error('\n   ❌ Some validations failed - review output above');
  }
}

// ============================================
// 4. MAIN
// ============================================

async function main() {
  console.log('🌱 VentyLab Curriculum Seed');
  console.log('============================');
  console.log(`Levels: ${LEVELS.length}`);
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${MODULES.reduce((s, m) => s + m.lessons.length, 0)}`);
  console.log(`Level prerequisites: ${LEVEL_PREREQUISITES.length}`);
  console.log(`Module prerequisites: ${MODULE_PREREQUISITES.length}`);

  await truncateContentTables();
  await seedLevels();
  await seedModules();
  await seedLessons();
  await seedLevelPrerequisites();
  await seedModulePrerequisites();
  await validate();

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

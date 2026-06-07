/**
 * =============================================================================
 * Funcionalidad : Seed de casos clínicos + configuración experta (OE2/OE3)
 * Descripción   : Puebla las tablas `clinical_cases` y `expert_configurations`
 *                 reutilizando la fuente de verdad clínica ya existente en
 *                 `src/modules/simulation/patient/clinical-cases.data.ts`.
 *
 *                 Sin estos datos el flujo de evaluación por caso clínico
 *                 (núcleo de OE2 «comparación con experto» y OE3 «explicación
 *                 de errores») es inalcanzable: `POST /api/cases/:id/evaluate`
 *                 respondía 500 «Configuración experta no disponible».
 *
 *                 NO inventa valores clínicos: deriva la ExpertConfiguration de
 *                 los `recommendedSettings` (modo, Vt, FR, PEEP, FiO2) y de la
 *                 mecánica del paciente (compliance, PEEP intrínseca) de cada
 *                 caso fuente.
 *
 *                 SEGURO DE RE-EJECUTAR: todas las escrituras usan upsert con
 *                 una clave estable (el `id` legible del caso fuente). No
 *                 modifica la lógica de seed.ts / seed-evaluation.ts ni viola
 *                 su invariante («never touches clinical_cases»): este script
 *                 es independiente y se invoca explícitamente.
 *
 *                 Comandos:
 *                   npm run seed:clinical
 *                   npx tsx prisma/seed-clinical-cases.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DECISIÓN DE VOCABULARIO (reconciliación verificada con el motor):
 *   `evaluation.service.ts` → `compareConfigurations` compara `ventilationMode`
 *   case-insensitive, y `buildFeedbackPrompt` mapea EXACTAMENTE el literal
 *   'volume' → «Volumen Control» (cualquier otro valor → «Presión Control»).
 *   Por tanto el ÚNICO vocabulario válido para `ventilationMode` es:
 *       'volume'   (modos controlados por volumen: VCV/SIMV)
 *       'pressure' (modos controlados por presión:  PCV/PSV)
 *   El formulario del frontend (Parte B) DEBE emitir exactamente estos dos
 *   literales. Ver `ventylab-web` → componente de formulario de parámetros.
 *
 *   `acceptableRanges` y `parameterPriorities` usan EXACTAMENTE las keys que
 *   recorre `compareConfigurations` (array `paramMappings`):
 *       tidalVolume, respiratoryRate, peep, fio2, maxPressure
 *   más la key especial `ventilationMode` para la prioridad del modo.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Desarrollo de una aplicación web para la enseñanza de
 *                 mecánica ventilatoria que integre un sistema de
 *                 retroalimentación usando modelos de lenguaje
 * Institución   : Universidad del Valle
 * Contacto      : marcela.mazo@correounivalle.edu.co
 * =============================================================================
 */

import { PrismaClient, CaseDifficulty, Pathology } from '@prisma/client';
import { CLINICAL_CASES, ClinicalCase } from '../src/modules/simulation/patient/clinical-cases.data';

const prisma = new PrismaClient();

// ─── Selección de casos a sembrar ──────────────────────────────────────────────
// 5 casos cubriendo los escenarios pedidos: SDRA/ARDS moderado, EPOC/COPD y
// pulmón normal/post-quirúrgico (post-quirúrgico + neuromuscular = mecánica sana).
const CASE_IDS_TO_SEED = [
  'basic-post-surgical',          // pulmón normal — post-quirúrgico   (VCV → volume)
  'basic-neuromuscular',          // pulmón normal — Guillain-Barré    (VCV → volume)
  'intermediate-ards-moderate',   // SDRA/ARDS moderado (COVID-19)     (VCV → volume)
  'intermediate-copd-exacerbation', // EPOC/COPD exacerbado            (PCV → pressure)
  'advanced-ards-severe',         // SDRA/ARDS severo refractario      (PCV → pressure)
];

// ─── Mapeos al contrato Prisma ─────────────────────────────────────────────────

/** Modo del simulador (VCV/PCV/SIMV/PSV) → vocabulario del motor de evaluación. */
function toVentilationMode(mode: ClinicalCase['recommendedSettings']['mode']): 'volume' | 'pressure' {
  // VCV y SIMV son controlados por volumen; PCV y PSV por presión.
  return mode === 'VCV' || mode === 'SIMV' ? 'volume' : 'pressure';
}

/** Dificultad del simulador → enum CaseDifficulty de Prisma. */
function toDifficulty(level: ClinicalCase['difficultyLevel']): CaseDifficulty {
  switch (level) {
    case 'BASIC':        return CaseDifficulty.BEGINNER;
    case 'INTERMEDIATE': return CaseDifficulty.INTERMEDIATE;
    case 'ADVANCED':     return CaseDifficulty.ADVANCED;
  }
}

/** Categoría clínica del simulador → enum Pathology de Prisma. */
function toPathology(category: ClinicalCase['category']): Pathology {
  switch (category) {
    case 'ARDS':         return Pathology.SDRA;
    case 'COPD':         return Pathology.EPOC;
    case 'ASTHMA':       return Pathology.ASMA;
    case 'POST_SURGICAL':
    case 'NEUROMUSCULAR':
    case 'TRAUMA':
    default:             return Pathology.OTRAS;
  }
}

/**
 * Presión meseta estática esperada (cmH2O), DERIVADA de la mecánica del paciente:
 *   Pplat ≈ PEEP_total + Vt / compliance     (PEEP_total = PEEP + PEEP intrínseca)
 * Se usa como `maxPressure` experta (objetivo de presión), no como un número
 * inventado. En SDRA severo el resultado supera 30 cmH2O — fiel a la realidad
 * clínica (es justamente la indicación de pronación del caso fuente).
 */
function expectedPlateau(c: ClinicalCase): number {
  const { peep } = c.recommendedSettings;
  const vt = c.recommendedSettings.tidalVolume;
  const { compliance, intrinsicPeep } = c.patient.respiratoryMechanics;
  return Math.round(peep + intrinsicPeep + vt / compliance);
}

/**
 * Prioridades por categoría — reflejan los objetivos de aprendizaje del caso
 * fuente (p.ej. en SDRA el Vt y la PEEP son críticos por ventilación protectora;
 * en EPOC la FR es crítica para evitar atrapamiento aéreo).
 */
function parameterPrioritiesFor(category: ClinicalCase['category']): Record<string, 'CRITICO' | 'IMPORTANTE' | 'OPCIONAL'> {
  switch (category) {
    case 'ARDS':
      return {
        tidalVolume: 'CRITICO',      // ventilación ultraprotectora 6 ml/kg
        peep: 'CRITICO',             // titulación PEEP (tabla ARDSNet)
        maxPressure: 'CRITICO',      // driving pressure / Pplateau
        fio2: 'IMPORTANTE',
        respiratoryRate: 'IMPORTANTE',
        ventilationMode: 'IMPORTANTE',
      };
    case 'COPD':
    case 'ASTHMA':
      return {
        respiratoryRate: 'CRITICO',  // FR baja para evitar hiperinflación dinámica
        peep: 'IMPORTANTE',          // PEEP externo < auto-PEEP
        tidalVolume: 'IMPORTANTE',
        fio2: 'IMPORTANTE',          // objetivo SpO2 88-92%
        maxPressure: 'IMPORTANTE',
        ventilationMode: 'IMPORTANTE',
      };
    case 'POST_SURGICAL':
    case 'NEUROMUSCULAR':
    case 'TRAUMA':
    default:
      return {
        tidalVolume: 'IMPORTANTE',   // 6-8 ml/kg IBW
        respiratoryRate: 'IMPORTANTE',
        peep: 'OPCIONAL',
        fio2: 'OPCIONAL',
        maxPressure: 'OPCIONAL',
        ventilationMode: 'OPCIONAL',
      };
  }
}

/**
 * Rangos aceptables = bandas de tolerancia clínica alrededor del valor experto.
 * DERIVADAS (no inventadas) del valor objetivo de cada parámetro:
 *   - tidalVolume     ±12 %  (banda de ventilación protectora)
 *   - respiratoryRate ±4 resp/min
 *   - peep            ±2 cmH2O (mín 0)
 *   - fio2            ±10 puntos porcentuales (mín 21 = aire ambiente, máx 100)
 *   - maxPressure     ±5 cmH2O
 */
function acceptableRangesFor(expert: {
  tidalVolume: number; respiratoryRate: number; peep: number; fio2: number; maxPressure: number;
}): Record<string, { min: number; max: number }> {
  return {
    tidalVolume: {
      min: Math.round(expert.tidalVolume * 0.88),
      max: Math.round(expert.tidalVolume * 1.12),
    },
    respiratoryRate: {
      min: Math.max(0, expert.respiratoryRate - 4),
      max: expert.respiratoryRate + 4,
    },
    peep: {
      min: Math.max(0, expert.peep - 2),
      max: expert.peep + 2,
    },
    fio2: {
      min: Math.max(21, expert.fio2 - 10),
      max: Math.min(100, expert.fio2 + 10),
    },
    maxPressure: {
      min: Math.max(0, expert.maxPressure - 5),
      max: expert.maxPressure + 5,
    },
  };
}

/**
 * Texto de justificación — reutiliza el razonamiento clínico ya presente en el
 * caso fuente (clinicalPearls + learningObjectives). Lo consume el prompt del
 * LLM y, cuando no hay IA, da contenido contextual al fallback determinístico.
 */
function buildJustification(c: ClinicalCase, expert: {
  ventilationMode: 'volume' | 'pressure'; tidalVolume: number; respiratoryRate: number;
  peep: number; fio2: number; maxPressure: number;
}): string {
  const modeLabel = expert.ventilationMode === 'volume' ? 'Volumen Control' : 'Presión Control';
  return [
    `Configuración experta para «${c.title}» (${c.patient.diagnosis}).`,
    '',
    'Parámetros recomendados y su justificación:',
    `• Modo: ${modeLabel} — apropiado para la mecánica de este paciente ` +
      `(compliance ${c.patient.respiratoryMechanics.compliance} ml/cmH2O, ` +
      `resistencia ${c.patient.respiratoryMechanics.resistance} cmH2O/L/s` +
      `${c.patient.respiratoryMechanics.intrinsicPeep > 0
        ? `, auto-PEEP ${c.patient.respiratoryMechanics.intrinsicPeep} cmH2O` : ''}).`,
    `• Volumen Tidal: ${expert.tidalVolume} ml.`,
    `• Frecuencia Respiratoria: ${expert.respiratoryRate} resp/min.`,
    `• PEEP: ${expert.peep} cmH2O.`,
    `• FiO2: ${expert.fio2} %.`,
    `• Presión meseta objetivo: ${expert.maxPressure} cmH2O (derivada de PEEP + Vt/compliance).`,
    '',
    'Objetivos de aprendizaje:',
    ...c.learningObjectives.map(o => `  - ${o}`),
    '',
    'Perlas clínicas:',
    ...c.clinicalPearls.map(p => `  - ${p}`),
    '',
    `Resultado esperado: ${c.expectedOutcome}`,
  ].join('\n');
}

/**
 * labData (gasometría) coherente con la patología: reutiliza la gasometría
 * arterial del caso fuente cuando existe; si el caso tiene pulmón sano (sin ABG),
 * registra la oximetría disponible.
 */
function buildLabData(c: ClinicalCase): Record<string, unknown> {
  const abg = c.patient.arterialBloodGas;
  const vit = c.patient.vitalSigns;
  if (abg) {
    return {
      ph: abg.ph,
      pao2: abg.pao2,
      paco2: abg.paco2,
      hco3: abg.hco3,
      baseExcess: abg.baseExcess,
      lactate: abg.lactate,
      spo2: vit?.spo2,
    };
  }
  return {
    spo2: vit?.spo2,
    note: 'Sin gasometría arterial — mecánica pulmonar conservada.',
  };
}

// ─── Seed ──────────────────────────────────────────────────────────────────────

async function seedCase(c: ClinicalCase): Promise<void> {
  const ventilationMode = toVentilationMode(c.recommendedSettings.mode);
  const maxPressure = expectedPlateau(c);

  const expert = {
    ventilationMode,
    tidalVolume: c.recommendedSettings.tidalVolume,
    respiratoryRate: c.recommendedSettings.respiratoryRate,
    peep: c.recommendedSettings.peep,
    fio2: Math.round(c.recommendedSettings.fio2 * 100), // fracción (0-1) → porcentaje (0-100)
    maxPressure,
  };

  // Clave estable de idempotencia: el id legible del caso fuente.
  const caseId = c.id;

  const caseFields = {
    title: c.title,
    description: c.description,
    patientAge: c.patient.demographics.age,
    patientWeight: c.patient.demographics.weight,
    mainDiagnosis: c.patient.diagnosis ?? c.title,
    comorbidities: [] as string[], // los casos fuente no declaran comorbilidades estructuradas
    labData: buildLabData(c) as any,
    difficulty: toDifficulty(c.difficultyLevel),
    pathology: toPathology(c.category),
    educationalGoal: c.learningObjectives.join(' • '),
    isActive: true,
  };

  await prisma.clinicalCase.upsert({
    where: { id: caseId },
    update: caseFields,
    create: { id: caseId, ...caseFields },
  });

  const expertFields = {
    ventilationMode: expert.ventilationMode,
    tidalVolume: expert.tidalVolume,
    respiratoryRate: expert.respiratoryRate,
    peep: expert.peep,
    fio2: expert.fio2,
    maxPressure: expert.maxPressure,
    justification: buildJustification(c, expert),
    acceptableRanges: acceptableRangesFor(expert) as any,
    parameterPriorities: parameterPrioritiesFor(c.category) as any,
  };

  // ExpertConfiguration: 1:1, upsert por la FK única clinicalCaseId.
  await prisma.expertConfiguration.upsert({
    where: { clinicalCaseId: caseId },
    update: expertFields,
    create: { clinicalCaseId: caseId, ...expertFields },
  });

  console.log(
    `  ✅ ${caseId}  [${caseFields.pathology}/${caseFields.difficulty}]  ` +
    `modo=${expert.ventilationMode} Vt=${expert.tidalVolume} FR=${expert.respiratoryRate} ` +
    `PEEP=${expert.peep} FiO2=${expert.fio2}% Pmax=${expert.maxPressure}`
  );
}

async function main() {
  console.log('\n🩺  seed-clinical-cases — VentyLab (OE2/OE3)');
  console.log('    Fuente: src/modules/simulation/patient/clinical-cases.data.ts\n');

  let seeded = 0;
  for (const id of CASE_IDS_TO_SEED) {
    const c = CLINICAL_CASES.find(x => x.id === id);
    if (!c) {
      console.warn(`  ⚠  Caso fuente no encontrado: ${id} (omitido)`);
      continue;
    }
    await seedCase(c);
    seeded++;
  }

  const totalCases = await prisma.clinicalCase.count();
  const totalExpert = await prisma.expertConfiguration.count();

  console.log('\n' + '─'.repeat(60));
  console.log(`    Sembrados en esta corrida: ${seeded}`);
  console.log(`    Total clinical_cases en BD: ${totalCases}`);
  console.log(`    Total expert_configurations en BD: ${totalExpert}`);
  console.log('─'.repeat(60) + '\n');
}

main()
  .catch((err) => {
    console.error('seed-clinical-cases failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

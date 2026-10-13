/*
 * Funcionalidad: Semilla de casos clínicos de la demostración
 * Descripción: Inserta o actualiza tres casos clínicos ficticios: dos publicados y listos para el motor de simulación (sexo, talla, mecánica, ajustes iniciales, estado inicial y metas), uno de ellos validado por experto, y un borrador incompleto; los perfiles se tipan con el modelo de lectura del feature de casos clínicos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import {
  type ClinicalCaseHistory,
  type ClinicalCaseInitialState,
  type ClinicalCaseMechanics,
  type ClinicalCaseTargets,
  type ClinicalCaseVentilatorSettings,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";

import { DEMO_TEACHERS } from "../demo-cast";
import { type DemoContext, type DemoDb, demoId, upsertAll } from "../demo-support";

export const DEMO_ARDS_CASE_ID: string = demoId("clinical-case:sdra-moderado");

export const DEMO_COPD_CASE_ID: string = demoId("clinical-case:epoc-exacerbado");

const DRAFT_CASE_ID: string = demoId("clinical-case:obesidad-postoperatorio");

function mechanics(overrides: Partial<ClinicalCaseMechanics>): ClinicalCaseMechanics {
  return {
    complianceMlPerCmH2O: 60,
    resistanceCmH2OPerLps: 8,
    deadSpaceMl: 150,
    vco2MlPerMin: 200,
    bicarbonateMmolPerL: 24,
    hemoglobinGPerDl: 14,
    arteriovenousO2DifferenceMlPerDl: 5,
    basalShuntFraction: 0.05,
    recruitmentCurve: [],
    patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
    hemodynamics: { baselineMapMmHg: 85, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 1 },
    gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 120 },
    deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
    ...overrides,
  };
}

function json<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export async function seedClinicalCases(db: DemoDb, context: DemoContext): Promise<void> {
  const [teacherA, teacherB] = DEMO_TEACHERS;
  const createdAt: Date = context.clock.at(-40, 11);

  const ardsHistory: ClinicalCaseHistory = { presentIllness: "Neumonía bilateral con hipoxemia progresiva de 48 horas.", relevantHistory: ["Hipertensión arterial", "Exfumador"] };
  const ardsSettings: ClinicalCaseVentilatorSettings = { mode: "VCV", tidalVolumeMl: 500, respiratoryRateBpm: 14, peepCmH2O: 6, fio2: 0.6, inspiratoryTimeS: 1 };
  const ardsState: ClinicalCaseInitialState = { paco2MmHg: 48, pao2MmHg: 62 };
  const ardsTargets: ClinicalCaseTargets = { spo2Percent: { min: 88, max: 95 }, plateauPressureMaxCmH2O: 30, drivingPressureMaxCmH2O: 15 };

  const copdHistory: ClinicalCaseHistory = { presentIllness: "Exacerbación de EPOC con fatiga muscular respiratoria.", relevantHistory: ["EPOC GOLD 3", "Oxígeno domiciliario"] };
  const copdSettings: ClinicalCaseVentilatorSettings = { mode: "VCV", tidalVolumeMl: 450, respiratoryRateBpm: 18, peepCmH2O: 5, fio2: 0.4, inspiratoryTimeS: 0.9 };
  const copdState: ClinicalCaseInitialState = { paco2MmHg: 62, pao2MmHg: 58 };
  const copdTargets: ClinicalCaseTargets = { spo2Percent: { min: 88, max: 92 }, autoPeepMaxCmH2O: 5 };

  const cases: Prisma.ClinicalCaseCreateManyInput[] = [
    {
      id: DEMO_ARDS_CASE_ID,
      title: "SDRA moderado por neumonía (demo)",
      description: "Paciente masculino de 58 años intubado por síndrome de dificultad respiratoria aguda.",
      summary: "Aplicar ventilación protectora con volumen corriente por peso predicho y titulación de PEEP.",
      history: json(ardsHistory),
      patientAge: 58,
      patientWeight: 78,
      patientSex: "MALE",
      patientHeightCm: 172,
      mainDiagnosis: "SDRA moderado",
      comorbidities: ["Hipertensión arterial"],
      labData: { ph: 7.31, paco2: 48, pao2: 62, hco3: 24 },
      difficulty: "INTERMEDIATE",
      pathology: "SDRA",
      educationalGoal: "Ajustar PEEP y volumen corriente con una estrategia protectora",
      mechanics: json(mechanics({ complianceMlPerCmH2O: 32, basalShuntFraction: 0.2 })),
      initialVentilatorSettings: json(ardsSettings),
      initialState: json(ardsState),
      events: [],
      targets: json(ardsTargets),
      status: "PUBLISHED",
      validatedByExpert: true,
      validatedById: teacherA.id,
      createdById: teacherA.id,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: DEMO_COPD_CASE_ID,
      title: "EPOC exacerbado con atrapamiento aéreo (demo)",
      description: "Paciente femenina de 67 años con exacerbación grave de EPOC.",
      summary: "Reducir el atrapamiento aéreo prolongando el tiempo espiratorio.",
      history: json(copdHistory),
      patientAge: 67,
      patientWeight: 61,
      patientSex: "FEMALE",
      patientHeightCm: 158,
      mainDiagnosis: "EPOC exacerbado",
      comorbidities: ["Cor pulmonale"],
      labData: { ph: 7.28, paco2: 62, pao2: 58, hco3: 30 },
      difficulty: "ADVANCED",
      pathology: "EPOC",
      educationalGoal: "Identificar y corregir la autoPEEP",
      mechanics: json(mechanics({ complianceMlPerCmH2O: 55, resistanceCmH2OPerLps: 22, bicarbonateMmolPerL: 30 })),
      initialVentilatorSettings: json(copdSettings),
      initialState: json(copdState),
      events: [],
      targets: json(copdTargets),
      status: "PUBLISHED",
      validatedByExpert: false,
      createdById: teacherB.id,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: DRAFT_CASE_ID,
      title: "Obesidad en el postoperatorio inmediato (borrador demo)",
      description: "Paciente con obesidad grado III en el postoperatorio de cirugía abdominal.",
      patientAge: 45,
      patientWeight: 128,
      mainDiagnosis: "Atelectasias postoperatorias",
      comorbidities: ["Obesidad grado III", "Apnea obstructiva del sueño"],
      difficulty: "ADVANCED",
      pathology: "OBESIDAD",
      educationalGoal: "Programar la ventilación según el peso predicho",
      status: "DRAFT",
      validatedByExpert: false,
      createdById: teacherB.id,
      isActive: true,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  await upsertAll(cases, (row: Prisma.ClinicalCaseCreateManyInput, id: string) => db.clinicalCase.upsert({ where: { id }, create: row, update: row }));
}

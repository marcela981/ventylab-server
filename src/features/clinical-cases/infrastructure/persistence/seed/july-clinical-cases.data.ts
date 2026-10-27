/*
 * Funcionalidad: Casos clínicos de julio listos para el motor fisiológico
 * Descripción: Datos de siembra de los tres casos predefinidos del simulador de paciente de julio (neumonía grave, EPOC descompensado y SDRA por sepsis), PUBLISHED y sin validación por experto: los valores de julio van tal cual (edad, sexo, peso, talla, gasometría, hemoglobina, ventilador inicial incluido el Vt 480 del EPOC, FiO2 de porcentaje a fracción y signos vitales); lo que julio no tenía usa los valores propuestos del Anexo B de DISENO_BLOQUE1.md, marcados "pendiente validación clínica". Fuente: _legacy-web-jul/src/features/simulador/simuladorPaciente/casosClinicos/datos/patientSimulatedData.js
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildDefaultRubric, type EngineReadySeedCase } from "@/features/clinical-cases/infrastructure/persistence/seed/engine-ready-clinical-cases.data";

export const JULY_PNEUMONIA_CASE_ID: string = "july-neumonia-grave";
export const JULY_COPD_CASE_ID: string = "july-epoc-descompensado";
export const JULY_ARDS_CASE_ID: string = "july-sdra-sepsis";

// Ti = 60 / RR × I / (I + E), from the July rate and I:E ratio
export const JULY_CLINICAL_CASES: readonly EngineReadySeedCase[] = [
  {
    id: JULY_PNEUMONIA_CASE_ID,
    content: {
      title: "Neumonía grave con hipoxemia",
      description:
        "Hombre de 60 años, con antecedentes de hipertensión, acude con dificultad respiratoria progresiva, fiebre, tos y desaturación. Saturación O₂: 84% con oxígeno suplementario. Rx de tórax muestra consolidación bilateral.",
      // pendiente validación clínica (propuesto: julio no tiene resumen)
      summary: "Insuficiencia respiratoria hipoxémica por neumonía bilateral; ventilación protectora y titulación de FiO2 y PEEP.",
      history: {
        presentIllness: "Dificultad respiratoria progresiva, fiebre, tos y desaturación; consolidación bilateral en la radiografía de tórax.",
        relevantHistory: ["Hipertensión arterial controlada", "Medicamentos: Enalapril 10mg, Hidroclorotiazida 25mg"],
        allergies: [],
      },
      patientAge: 60,
      patientWeight: 70,
      mainDiagnosis: "Neumonía grave con insuficiencia respiratoria tipo I (hipoxémica)",
      comorbidities: ["Hipertensión arterial"],
      labData: { ph: 7.45, paco2: 35, pao2: 52, hco3: 24, fio2: 0.4 },
      difficulty: "INTERMEDIATE",
      pathology: "NEUMONIA",
      // pendiente validación clínica (propuesto: julio no tiene objetivo educativo)
      educationalGoal: "Programar ventilación protectora (Vt 6 mL/kg de peso predicho) y titular FiO2 y PEEP para corregir la hipoxemia sin exceder la presión meseta.",
      simulation: {
        patientSex: "MALE",
        patientHeightCm: 175,
        mechanics: {
          // pendiente validación clínica (propuesto, Anexo B)
          complianceMlPerCmH2O: 35,
          // pendiente validación clínica (propuesto, Anexo B)
          resistanceCmH2OPerLps: 10,
          // pendiente validación clínica (propuesto)
          deadSpaceMl: 170,
          // pendiente validación clínica (propuesto: fiebre de 39.1 °C)
          vco2MlPerMin: 240,
          bicarbonateMmolPerL: 24,
          hemoglobinGPerDl: 13.5,
          // pendiente validación clínica (propuesto)
          arteriovenousO2DifferenceMlPerDl: 5,
          // pendiente validación clínica (propuesto: PaO2/FiO2 130)
          basalShuntFraction: 0.25,
          // pendiente validación clínica (propuesto)
          recruitmentCurve: [
            { peepCmH2O: 5, shuntFraction: 0.25 },
            { peepCmH2O: 10, shuntFraction: 0.2 },
            { peepCmH2O: 15, shuntFraction: 0.17 },
          ],
          // pendiente validación clínica (propuesto: paciente sedado sin esfuerzo)
          patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
          // Baseline MAP from the July PAS/PAD 150/90; threshold and drop: pendiente validación clínica (propuestos)
          hemodynamics: { baselineMapMmHg: 110, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 1 },
          // pendiente validación clínica (propuestos)
          gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 150 },
          // pendiente validación clínica (propuesto: escenario estable)
          deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
        },
        // July: VCV, Vt 420, RR 20, FiO2 100 %, PEEP 8, I:E 1:2, trigger -2 cmH2O
        initialVentilatorSettings: {
          mode: "VCV",
          tidalVolumeMl: 420,
          respiratoryRateBpm: 20,
          peepCmH2O: 8,
          fio2: 1,
          inspiratoryTimeS: 1,
          // pendiente validación clínica (propuesto)
          flowPattern: "SQUARE",
          // pendiente validación clínica (propuesto)
          inspiratoryPauseS: 0,
          triggerType: "PRESSURE",
          pressureTriggerCmH2O: 2,
        },
        initialState: { paco2MmHg: 35, pao2MmHg: 52 },
        events: [],
        // pendiente validación clínica (propuestos)
        targets: {
          spo2Percent: { min: 92, max: 96 },
          paco2MmHg: { min: 35, max: 45 },
          ph: { min: 7.35, max: 7.45 },
          plateauPressureMaxCmH2O: 30,
          drivingPressureMaxCmH2O: 15,
          tidalVolumePerKgPbw: { min: 6, max: 8 },
          autoPeepMaxCmH2O: 5,
        },
        // pendiente validación clínica (propuesto: rúbrica por defecto de los casos del motor)
        defaultRubric: buildDefaultRubric(5),
      },
      initialVitals: { heartRateBpm: 105, respiratoryRateBpm: 24, spo2Percent: 84, temperatureC: 39.1, systolicMmHg: 150, diastolicMmHg: 90, glasgow: 15 },
    },
  },
  {
    id: JULY_COPD_CASE_ID,
    content: {
      title: "EPOC descompensado",
      description:
        "Mujer de 68 años, fumadora activa, con antecedentes de EPOC. Presenta disnea severa, hipercapnia (PaCO₂: 75 mmHg), pH 7.25. Uso de músculos accesorios.",
      // pendiente validación clínica (propuesto: julio no tiene resumen)
      summary: "Exacerbación de EPOC con acidosis respiratoria e hipercapnia; riesgo de atrapamiento aéreo.",
      history: {
        presentIllness: "Disnea severa con uso de músculos accesorios en paciente fumadora activa con EPOC.",
        relevantHistory: ["EPOC", "Tabaquismo activo", "Enfisema pulmonar severo, Cor pulmonale crónico", "Medicamentos: Salbutamol inhalado, Tiotropio, Prednisona"],
        allergies: [],
      },
      patientAge: 68,
      patientWeight: 65,
      mainDiagnosis: "Exacerbación aguda de EPOC con acidosis respiratoria",
      comorbidities: ["Tabaquismo", "Cor pulmonale crónico"],
      labData: { ph: 7.25, paco2: 75, pao2: 58, hco3: 32, fio2: 0.35 },
      difficulty: "INTERMEDIATE",
      pathology: "EPOC",
      // pendiente validación clínica (propuesto: julio no tiene objetivo educativo)
      educationalGoal: "Alargar el tiempo espiratorio para limitar el atrapamiento aéreo, evitar la hiperoxia y corregir la acidosis sin buscar una PaCO2 normal.",
      simulation: {
        patientSex: "FEMALE",
        patientHeightCm: 160,
        mechanics: {
          // pendiente validación clínica (propuesto, Anexo B)
          complianceMlPerCmH2O: 71,
          // pendiente validación clínica (propuesto, Anexo B)
          resistanceCmH2OPerLps: 20,
          // pendiente validación clínica (propuesto)
          deadSpaceMl: 220,
          // pendiente validación clínica (propuesto)
          vco2MlPerMin: 220,
          bicarbonateMmolPerL: 32,
          hemoglobinGPerDl: 16.8,
          // pendiente validación clínica (propuesto)
          arteriovenousO2DifferenceMlPerDl: 5,
          // pendiente validación clínica (propuesto)
          basalShuntFraction: 0.1,
          // pendiente validación clínica (propuesto: la PEEP no recluta en EPOC)
          recruitmentCurve: [{ peepCmH2O: 0, shuntFraction: 0.1 }],
          // pendiente validación clínica (propuesto: paciente sedado sin esfuerzo)
          patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
          // Baseline MAP from the July PAS/PAD 135/85; threshold and drop: pendiente validación clínica (propuestos)
          hemodynamics: { baselineMapMmHg: 101.7, meanAirwayPressureThresholdCmH2O: 12, mapDropPerCmH2O: 2 },
          // pendiente validación clínica (propuestos)
          gasTimeConstants: { paco2TimeConstantMin: 8, oxygenTimeConstantS: 300 },
          // pendiente validación clínica (propuesto: escenario estable)
          deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
        },
        // July: VCV, Vt 480 (kept as in July), RR 12, FiO2 35 %, PEEP 5, I:E 1:4, trigger -1 cmH2O
        initialVentilatorSettings: {
          mode: "VCV",
          tidalVolumeMl: 480,
          respiratoryRateBpm: 12,
          peepCmH2O: 5,
          fio2: 0.35,
          inspiratoryTimeS: 1,
          // pendiente validación clínica (propuesto)
          flowPattern: "SQUARE",
          // pendiente validación clínica (propuesto)
          inspiratoryPauseS: 0,
          triggerType: "PRESSURE",
          pressureTriggerCmH2O: 1,
        },
        initialState: { paco2MmHg: 75, pao2MmHg: 58 },
        events: [],
        // pendiente validación clínica (propuestos)
        targets: {
          spo2Percent: { min: 88, max: 92 },
          paco2MmHg: { min: 50, max: 65 },
          ph: { min: 7.3, max: 7.45 },
          plateauPressureMaxCmH2O: 30,
          drivingPressureMaxCmH2O: 15,
          tidalVolumePerKgPbw: { min: 6, max: 8 },
          autoPeepMaxCmH2O: 5,
        },
        // pendiente validación clínica (propuesto: rúbrica por defecto de los casos del motor)
        defaultRubric: buildDefaultRubric(5),
      },
      initialVitals: { heartRateBpm: 95, respiratoryRateBpm: 28, spo2Percent: 88, temperatureC: 37.5, systolicMmHg: 135, diastolicMmHg: 85, glasgow: 14 },
    },
  },
  {
    id: JULY_ARDS_CASE_ID,
    content: {
      title: "SDRA por sepsis",
      description: "Hombre de 55 años con sepsis secundaria a infección abdominal. Presenta disnea intensa, infiltrados bilaterales en la Rx, PaO₂/FiO₂: 140.",
      // pendiente validación clínica (propuesto: julio no tiene resumen)
      summary: "SDRA moderado a severo con shock séptico; ventilación protectora, PEEP alta e hipotensión a vigilar.",
      history: {
        presentIllness: "Sepsis de origen abdominal con disnea intensa e infiltrados bilaterales.",
        relevantHistory: ["Sepsis abdominal, peritonitis secundaria", "Shock séptico", "Medicamentos: Noradrenalina, Vancomicina, Piperacilina-Tazobactam"],
        allergies: [],
      },
      patientAge: 55,
      patientWeight: 72,
      mainDiagnosis: "Síndrome de distrés respiratorio agudo (SDRA moderado a severo) secundario a sepsis abdominal",
      comorbidities: ["Shock séptico", "Insuficiencia renal aguda"],
      labData: { ph: 7.3, paco2: 45, pao2: 63, hco3: 20, fio2: 0.8 },
      difficulty: "ADVANCED",
      pathology: "SDRA",
      // pendiente validación clínica (propuesto: julio no tiene objetivo educativo)
      educationalGoal: "Aplicar ventilación protectora en SDRA (Vt 6 mL/kg de peso predicho, presión meseta ≤ 30 cmH2O) y titular PEEP y FiO2 vigilando la presión arterial.",
      simulation: {
        patientSex: "MALE",
        patientHeightCm: 173,
        mechanics: {
          // pendiente validación clínica (propuesto, Anexo B: 15-25)
          complianceMlPerCmH2O: 20,
          // pendiente validación clínica (propuesto, Anexo B)
          resistanceCmH2OPerLps: 12,
          // pendiente validación clínica (propuesto)
          deadSpaceMl: 200,
          // pendiente validación clínica (propuesto: sepsis con fiebre de 38.8 °C)
          vco2MlPerMin: 280,
          bicarbonateMmolPerL: 20,
          hemoglobinGPerDl: 9.8,
          // pendiente validación clínica (propuesto)
          arteriovenousO2DifferenceMlPerDl: 5,
          // pendiente validación clínica (propuesto: PaO2/FiO2 de 79 en julio)
          basalShuntFraction: 0.4,
          // pendiente validación clínica (propuesto)
          recruitmentCurve: [
            { peepCmH2O: 5, shuntFraction: 0.4 },
            { peepCmH2O: 10, shuntFraction: 0.32 },
            { peepCmH2O: 15, shuntFraction: 0.26 },
          ],
          // pendiente validación clínica (propuesto: paciente sedado sin esfuerzo)
          patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
          // Baseline MAP from the July PAS/PAD 85/45; threshold and drop: pendiente validación clínica (propuestos)
          hemodynamics: { baselineMapMmHg: 58.3, meanAirwayPressureThresholdCmH2O: 12, mapDropPerCmH2O: 1.5 },
          // pendiente validación clínica (propuestos)
          gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 180 },
          // pendiente validación clínica (propuesto: progresión lenta si no se corrige)
          deterioration: { ratePerMin: 0.01, maxComplianceLossFraction: 0.2, maxShuntIncrease: 0.1 },
        },
        // July: VCV, Vt 420, RR 22, FiO2 90 %, PEEP 11, I:E 1:2, trigger -1 cmH2O
        initialVentilatorSettings: {
          mode: "VCV",
          tidalVolumeMl: 420,
          respiratoryRateBpm: 22,
          peepCmH2O: 11,
          fio2: 0.9,
          inspiratoryTimeS: 0.91,
          // pendiente validación clínica (propuesto)
          flowPattern: "SQUARE",
          // pendiente validación clínica (propuesto)
          inspiratoryPauseS: 0,
          triggerType: "PRESSURE",
          pressureTriggerCmH2O: 1,
        },
        initialState: { paco2MmHg: 45, pao2MmHg: 63 },
        events: [],
        // pendiente validación clínica (propuestos: metas de ARDSNet)
        targets: {
          spo2Percent: { min: 88, max: 95 },
          paco2MmHg: { min: 35, max: 60 },
          ph: { min: 7.3, max: 7.45 },
          plateauPressureMaxCmH2O: 30,
          drivingPressureMaxCmH2O: 15,
          tidalVolumePerKgPbw: { min: 4, max: 8 },
          autoPeepMaxCmH2O: 5,
        },
        // pendiente validación clínica (propuesto: rúbrica por defecto de los casos del motor)
        defaultRubric: buildDefaultRubric(5),
      },
      initialVitals: { heartRateBpm: 128, respiratoryRateBpm: 32, spo2Percent: 89, temperatureC: 38.8, systolicMmHg: 85, diastolicMmHg: 45, glasgow: 12 },
    },
  },
];

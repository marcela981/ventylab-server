import { PatientCondition, RespiratoryMechanics } from './patient.types';

/**
 * Rangos normales de mecánica respiratoria
 */
export const NORMAL_RESPIRATORY_MECHANICS: RespiratoryMechanics = {
    compliance: 75,        // ml/cmH2O
    resistance: 3,         // cmH2O/L/s
    functionalResidualCapacity: 2400, // ml
    intrinsicPeep: 0,
};

/**
 * Modificadores de mecánica por condición
 * Valores representan factor multiplicador o valor absoluto
 */
export const CONDITION_MECHANICS: Record<PatientCondition, Partial<RespiratoryMechanics>> = {
    [PatientCondition.HEALTHY]: {},

    // ARDS - Compliance muy reducida
    [PatientCondition.ARDS_MILD]: { compliance: 40, resistance: 6 },
    [PatientCondition.ARDS_MODERATE]: { compliance: 25, resistance: 8 },
    [PatientCondition.ARDS_SEVERE]: { compliance: 15, resistance: 10 },

    // EPOC - Resistencia aumentada, atrapamiento aéreo
    [PatientCondition.COPD_MILD]: { resistance: 8, intrinsicPeep: 2 },
    [PatientCondition.COPD_MODERATE]: { resistance: 12, intrinsicPeep: 5 },
    [PatientCondition.COPD_SEVERE]: { resistance: 18, intrinsicPeep: 8 },

    // Asma - Similar a EPOC pero más reversible
    [PatientCondition.ASTHMA_MILD]: { resistance: 10, intrinsicPeep: 2 },
    [PatientCondition.ASTHMA_MODERATE]: { resistance: 15, intrinsicPeep: 4 },
    [PatientCondition.ASTHMA_SEVERE]: { resistance: 25, intrinsicPeep: 8 },

    // Otras condiciones
    [PatientCondition.PNEUMONIA]: { compliance: 35, resistance: 7 },
    [PatientCondition.PULMONARY_EDEMA]: { compliance: 30, resistance: 6 },
    [PatientCondition.PNEUMOTHORAX]: { compliance: 20, resistance: 5 },
    [PatientCondition.OBESITY_HYPOVENTILATION]: { compliance: 40, functionalResidualCapacity: 1800 },
    [PatientCondition.NEUROMUSCULAR]: { compliance: 60 },  // Pulmón normal, problema muscular
    [PatientCondition.POST_SURGICAL]: { compliance: 50, resistance: 5 },
};

/**
 * Rangos seguros para validación
 */
export const PATIENT_VALIDATION_RANGES = {
    weight: { min: 30, max: 250 },      // kg
    height: { min: 100, max: 220 },     // cm
    age: { min: 18, max: 100 },         // años
    compliance: { min: 10, max: 100 },  // ml/cmH2O
    resistance: { min: 1, max: 30 },    // cmH2O/L/s
    heartRate: { min: 30, max: 200 },   // lpm
    respiratoryRate: { min: 5, max: 50 }, // rpm
    spo2: { min: 50, max: 100 },        // %
    temperature: { min: 34, max: 42 },  // °C
    glasgowScore: { min: 3, max: 15 },
};

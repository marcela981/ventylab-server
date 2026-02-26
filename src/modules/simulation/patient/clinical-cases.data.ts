import { PatientModel, PatientCondition } from './patient.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClinicalCase {
    id: string;
    title: string;
    description: string;
    difficultyLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    category: 'ARDS' | 'COPD' | 'ASTHMA' | 'TRAUMA' | 'POST_SURGICAL' | 'NEUROMUSCULAR';
    patient: Omit<PatientModel, 'id' | 'calculated' | 'createdAt'>;
    recommendedSettings: {
        mode: 'VCV' | 'PCV' | 'SIMV' | 'PSV';
        tidalVolume: number;
        respiratoryRate: number;
        peep: number;
        fio2: number;
    };
    learningObjectives: string[];
    clinicalPearls: string[];
    expectedOutcome: string;
    estimatedDurationMinutes: number;
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const CLINICAL_CASES: ClinicalCase[] = [

    // =========================================================================
    // BÁSICOS
    // =========================================================================

    {
        id: 'basic-post-surgical',
        title: 'Paciente Post-Quirúrgico Sin Complicaciones',
        description: 'Hombre de 45 años post-colecistectomía laparoscópica. Mecánica conservada, extubación programada en las próximas horas.',
        difficultyLevel: 'BASIC',
        category: 'POST_SURGICAL',
        patient: {
            demographics: {
                name: 'Juan García',
                weight: 75,
                height: 175,
                age: 45,
                gender: 'M',
            },
            respiratoryMechanics: {
                compliance: 60,          // ml/cmH2O — levemente reducida por cirugía
                resistance: 4,           // cmH2O/L/s — normal
                functionalResidualCapacity: 2200,
                intrinsicPeep: 0,
            },
            condition: PatientCondition.POST_SURGICAL,
            vitalSigns: {
                heartRate: 78,
                respiratoryRate: 14,
                spo2: 97,
                systolicBP: 125,
                diastolicBP: 78,
                temperature: 36.5,
            },
            physicalExam: {
                glasgowScore: 15,
                lungAuscultation: 'Murmullo vesicular normal bilateral',
                accessoryMuscleUse: false,
                breathingPattern: 'normal',
            },
            diagnosis: 'Post-operatorio de colecistectomía laparoscópica',
            difficultyLevel: 'BASIC',
        },
        recommendedSettings: {
            mode: 'VCV',
            tidalVolume: 480,    // ~6.7 ml/kg IBW (IBW ≈ 70 kg)
            respiratoryRate: 12,
            peep: 5,
            fio2: 0.4,
        },
        learningObjectives: [
            'Calcular volumen tidal según peso corporal ideal (6-8 ml/kg IBW)',
            'Reconocer parámetros de ventilación protectora pulmonar',
            'Identificar criterios básicos de destete ventilatorio',
            'Monitorear signos de extubación exitosa',
        ],
        clinicalPearls: [
            'PEEP de 5 cmH2O previene microatelectasias post-operatorias',
            'El volumen tidal se calcula sobre el IBW, no el peso real',
            'FiO2 0.4 es suficiente en pulmón sano; reduce si SpO2 > 97%',
            'Evaluar RSBI (FR/VT) < 105 antes de considerar extubación',
        ],
        expectedOutcome: 'Extubación exitosa con transición a cánula nasal de bajo flujo',
        estimatedDurationMinutes: 20,
    },

    {
        id: 'basic-neuromuscular',
        title: 'Debilidad Neuromuscular - Síndrome de Guillain-Barré',
        description: 'Mujer de 38 años con Guillain-Barré en fase ascendente. Pulmón intrínsecamente sano pero con falla ventilatoria por debilidad muscular.',
        difficultyLevel: 'BASIC',
        category: 'NEUROMUSCULAR',
        patient: {
            demographics: {
                name: 'Laura Hernández',
                weight: 62,
                height: 163,
                age: 38,
                gender: 'F',
            },
            respiratoryMechanics: {
                compliance: 60,          // pulmón sano
                resistance: 3,           // vías aéreas normales
                functionalResidualCapacity: 2400,
                intrinsicPeep: 0,
            },
            condition: PatientCondition.NEUROMUSCULAR,
            vitalSigns: {
                heartRate: 88,
                respiratoryRate: 22,
                spo2: 94,
                systolicBP: 118,
                diastolicBP: 72,
                temperature: 37.1,
            },
            physicalExam: {
                glasgowScore: 15,
                lungAuscultation: 'Murmullo vesicular disminuido en bases',
                accessoryMuscleUse: true,
                breathingPattern: 'tachypneic',
            },
            diagnosis: 'Síndrome de Guillain-Barré con falla ventilatoria',
            difficultyLevel: 'BASIC',
        },
        recommendedSettings: {
            mode: 'VCV',
            tidalVolume: 340,    // 6 ml/kg IBW (IBW ≈ 57 kg)
            respiratoryRate: 14,
            peep: 5,
            fio2: 0.35,
        },
        learningObjectives: [
            'Distinguir falla ventilatoria de falla oxigenatoria',
            'Entender que el problema neuromuscular no altera la mecánica pulmonar',
            'Configurar ventilación con pulmón sano como soporte de musculatura',
            'Planificar estrategia de destete gradual según recuperación',
        ],
        clinicalPearls: [
            'En Guillain-Barré el pulmón está sano — la mecánica pulmonar es normal',
            'Indicar intubación si CVF < 20 ml/kg o PIM < 30 cmH2O',
            'PEEP bajo es suficiente; el objetivo es soporte, no reclutamiento',
            'El destete puede ser prolongado semanas según recuperación neurológica',
        ],
        expectedOutcome: 'Soporte ventilatorio estable; destete gradual según recuperación neurológica',
        estimatedDurationMinutes: 25,
    },

    // =========================================================================
    // INTERMEDIOS
    // =========================================================================

    {
        id: 'intermediate-ards-moderate',
        title: 'SDRA Moderado - Neumonía por COVID-19',
        description: 'Mujer de 58 años con neumonía bilateral por COVID-19. PaO₂/FiO₂ de 150 mmHg pese a O₂ de alto flujo. Requiere intubación y ventilación protectora.',
        difficultyLevel: 'INTERMEDIATE',
        category: 'ARDS',
        patient: {
            demographics: {
                name: 'María López',
                weight: 68,
                height: 162,
                age: 58,
                gender: 'F',
            },
            respiratoryMechanics: {
                compliance: 28,          // reducida — reclutamiento parcial posible
                resistance: 8,
                functionalResidualCapacity: 1600,
                intrinsicPeep: 0,
            },
            condition: PatientCondition.ARDS_MODERATE,
            vitalSigns: {
                heartRate: 105,
                respiratoryRate: 28,
                spo2: 88,
                systolicBP: 110,
                diastolicBP: 65,
                temperature: 38.2,
            },
            arterialBloodGas: {
                ph: 7.32,
                pao2: 63,
                paco2: 48,
                hco3: 22,
                baseExcess: -3,
                lactate: 1.8,
            },
            physicalExam: {
                glasgowScore: 11,
                lungAuscultation: 'Crepitantes bilaterales difusos, predominio en bases',
                accessoryMuscleUse: true,
                breathingPattern: 'tachypneic',
            },
            diagnosis: 'SDRA moderado secundario a neumonía por SARS-CoV-2',
            difficultyLevel: 'INTERMEDIATE',
        },
        recommendedSettings: {
            mode: 'VCV',
            tidalVolume: 340,    // 6 ml/kg IBW (IBW ≈ 57 kg)
            respiratoryRate: 20,
            peep: 12,            // tabla FiO2/PEEP ARDSNet moderado
            fio2: 0.6,
        },
        learningObjectives: [
            'Aplicar estrategia de ventilación ultraprotectora en SDRA',
            'Titular PEEP según tabla FiO2/PEEP de ARDSNet',
            'Calcular y monitorear driving pressure (objetivo < 15 cmH2O)',
            'Identificar indicación de posición prono (PaO₂/FiO₂ < 150 persistente)',
        ],
        clinicalPearls: [
            'Driving pressure = Pplateau − PEEP; objetivo < 15 cmH2O',
            'En el SDRA moderado a severo intentar prono precoz (< 36 h)',
            'Hipercapnia permisiva tolerable hasta pH > 7.20',
            'No subir FiO2 indefinidamente — preferir optimizar PEEP',
        ],
        expectedOutcome: 'Mejoría de oxigenación con ventilación protectora; reevaluar en 12-24 h para posible prono',
        estimatedDurationMinutes: 45,
    },

    {
        id: 'intermediate-copd-exacerbation',
        title: 'Exacerbación de EPOC con Acidosis Respiratoria',
        description: 'Hombre de 72 años, EPOC Gold IV, exacerbación infecciosa. Auto-PEEP significativo, riesgo de hiperinflación dinámica.',
        difficultyLevel: 'INTERMEDIATE',
        category: 'COPD',
        patient: {
            demographics: {
                name: 'Carlos Mendoza',
                weight: 62,
                height: 168,
                age: 72,
                gender: 'M',
            },
            respiratoryMechanics: {
                compliance: 55,          // aumentada por enfisema
                resistance: 15,          // obstrucción severa
                functionalResidualCapacity: 3200, // hiperinflación crónica
                intrinsicPeep: 6,        // auto-PEEP significativo
            },
            condition: PatientCondition.COPD_SEVERE,
            vitalSigns: {
                heartRate: 95,
                respiratoryRate: 26,
                spo2: 84,
                systolicBP: 145,
                diastolicBP: 85,
                temperature: 37.8,
            },
            arterialBloodGas: {
                ph: 7.28,
                pao2: 52,
                paco2: 68,
                hco3: 28,
                baseExcess: 2,
                lactate: 1.2,
            },
            physicalExam: {
                glasgowScore: 14,
                lungAuscultation: 'Sibilancias espiratorias difusas, espiración prolongada',
                accessoryMuscleUse: true,
                breathingPattern: 'tachypneic',
            },
            diagnosis: 'Exacerbación aguda de EPOC con acidosis respiratoria descompensada',
            difficultyLevel: 'INTERMEDIATE',
        },
        recommendedSettings: {
            mode: 'PCV',
            tidalVolume: 400,
            respiratoryRate: 14,   // baja frecuencia para permitir espiración completa
            peep: 4,               // < auto-PEEP medido (6 cmH2O)
            fio2: 0.35,
        },
        learningObjectives: [
            'Reconocer y cuantificar auto-PEEP mediante pausa espiratoria',
            'Configurar relación I:E extendida (1:3 o mayor) en EPOC',
            'Evitar hiperinflación dinámica con frecuencias bajas',
            'Titular FiO₂ conservadoramente (objetivo SpO₂ 88-92%)',
        ],
        clinicalPearls: [
            'PEEP externo debe ser < auto-PEEP (< 80% del auto-PEEP medido)',
            'Frecuencias bajas son clave: cada respiro extra aumenta atrapamiento',
            'En EPOC el objetivo SpO₂ es 88-92%, no 95-100%',
            'HCO₃ elevado revela compensación crónica — no es bicarbonato agudo',
        ],
        expectedOutcome: 'Reducción de auto-PEEP y mejoría ventilatoria en 24-48 h; valorar VMNI si tolera',
        estimatedDurationMinutes: 40,
    },

    // =========================================================================
    // AVANZADOS
    // =========================================================================

    {
        id: 'advanced-ards-severe',
        title: 'SDRA Severo Refractario — Candidato a Pronación',
        description: 'Hombre de 52 años con SDRA severo post-aspiración. PaO₂/FiO₂ de 85 pese a PEEP 16 cmH2O. Shock séptico concomitante.',
        difficultyLevel: 'ADVANCED',
        category: 'ARDS',
        patient: {
            demographics: {
                name: 'Roberto Sánchez',
                weight: 85,
                height: 178,
                age: 52,
                gender: 'M',
            },
            respiratoryMechanics: {
                compliance: 18,          // muy reducida — SDRA severo
                resistance: 12,
                functionalResidualCapacity: 1200,
                intrinsicPeep: 0,
            },
            condition: PatientCondition.ARDS_SEVERE,
            vitalSigns: {
                heartRate: 118,
                respiratoryRate: 30,
                spo2: 82,
                systolicBP: 95,
                diastolicBP: 55,
                temperature: 38.8,
            },
            arterialBloodGas: {
                ph: 7.22,
                pao2: 55,
                paco2: 58,
                hco3: 20,
                baseExcess: -6,
                lactate: 3.2,
            },
            physicalExam: {
                glasgowScore: 8,
                lungAuscultation: 'Crepitantes difusos bilaterales, zonas de silencio en bases',
                accessoryMuscleUse: true,
                breathingPattern: 'paradoxical',
            },
            diagnosis: 'SDRA severo post-aspiración con shock séptico',
            difficultyLevel: 'ADVANCED',
        },
        recommendedSettings: {
            mode: 'PCV',
            tidalVolume: 420,    // ~6 ml/kg IBW (IBW ≈ 73 kg)
            respiratoryRate: 24,
            peep: 16,
            fio2: 1.0,
        },
        learningObjectives: [
            'Manejar SDRA refractario a tratamiento convencional',
            'Reconocer indicación absoluta de posición prono (PaO₂/FiO₂ < 150)',
            'Optimizar PEEP en compliance severamente reducida',
            'Balancear protección pulmonar vs. ventilación adecuada en acidosis grave',
            'Identificar límites del soporte convencional y criterios de ECMO',
        ],
        clinicalPearls: [
            'Driving pressure > 15 = VILI en curso; reducir VT aunque suba PCO₂',
            'Prono 16 h/día mejora mortalidad en PaO₂/FiO₂ < 150 (estudio PROSEVA)',
            'Considerar ECMO-VV si Pplat > 30 con VT < 4 ml/kg y pH < 7.15',
            'En shock séptico la hipovolemia puede coexistir con PEEP elevado',
            'Monitorear presión de pulso diferencial para optimizar volemia',
        ],
        expectedOutcome: 'Inicio de pronación inmediata; reevaluar ECMO-VV si sin respuesta en 12 h',
        estimatedDurationMinutes: 60,
    },

    {
        id: 'advanced-status-asthmaticus',
        title: 'Status Asmático con Hiperinflación Severa',
        description: 'Joven de 16 años con asma, intubada de emergencia por crisis refractaria. Auto-PEEP de 12 cmH2O, riesgo inmediato de barotrauma.',
        difficultyLevel: 'ADVANCED',
        category: 'ASTHMA',
        patient: {
            demographics: {
                name: 'Ana Torres',
                weight: 55,
                height: 165,
                age: 16,
                gender: 'F',
            },
            respiratoryMechanics: {
                compliance: 50,
                resistance: 28,          // obstrucción crítica
                functionalResidualCapacity: 3500, // hiperinflación severa
                intrinsicPeep: 12,       // auto-PEEP crítico
            },
            condition: PatientCondition.ASTHMA_SEVERE,
            vitalSigns: {
                heartRate: 135,
                respiratoryRate: 32,
                spo2: 78,
                systolicBP: 90,
                diastolicBP: 50,
                temperature: 37.0,
            },
            arterialBloodGas: {
                ph: 7.15,
                pao2: 58,
                paco2: 85,
                hco3: 24,
                baseExcess: -4,
                lactate: 4.5,
            },
            physicalExam: {
                glasgowScore: 10,
                lungAuscultation: 'Silencio auscultatorio bilateral (tórax silente)',
                accessoryMuscleUse: true,
                breathingPattern: 'paradoxical',
            },
            diagnosis: 'Status asmático severo con acidosis respiratoria grave e hipoxemia',
            difficultyLevel: 'ADVANCED',
        },
        recommendedSettings: {
            mode: 'VCV',
            tidalVolume: 330,    // ~6 ml/kg IBW (IBW ≈ 55 kg)
            respiratoryRate: 10, // baja frecuencia, máximo tiempo espiratorio
            peep: 0,             // contraindicado — suma al auto-PEEP
            fio2: 1.0,
        },
        learningObjectives: [
            'Manejar hiperinflación dinámica extrema con auto-PEEP elevado',
            'Aplicar hipercapnia permisiva controlada de forma segura',
            'Configurar tiempos espiratorios muy prolongados (I:E ≥ 1:4)',
            'Reconocer el riesgo inminente de barotrauma (neumotórax)',
            'Integrar broncodilatadores y sedoanalgesia en el plan ventilatorio',
        ],
        clinicalPearls: [
            'PEEP externo es CONTRAINDICADO — se suma al auto-PEEP y genera colapso hemodinámico',
            'Frecuencia 8-10 rpm con I:E 1:4 o 1:5 para vaciar pulmón',
            'Tolerar PCO₂ de 80-100 si pH > 7.10 (hipercapnia permisiva)',
            'Tórax silente es peor que sibilancias — obstrucción crítica',
            'Sedación profunda + bloqueo neuromuscular reduce el trabajo respiratorio',
        ],
        expectedOutcome: 'Estabilización hemodinámica y broncodilatación agresiva; vigilar barotrauma con Rx seriadas',
        estimatedDurationMinutes: 50,
    },
];

// ---------------------------------------------------------------------------
// Indexes and helpers
// ---------------------------------------------------------------------------

/**
 * Mapa de casos por ID para búsqueda O(1)
 */
export const CLINICAL_CASES_MAP = new Map<string, ClinicalCase>(
    CLINICAL_CASES.map(c => [c.id, c]),
);

/**
 * Filtra casos por categoría clínica
 */
export function getCasesByCategory(category: ClinicalCase['category']): ClinicalCase[] {
    return CLINICAL_CASES.filter(c => c.category === category);
}

/**
 * Filtra casos por nivel de dificultad
 */
export function getCasesByDifficulty(level: ClinicalCase['difficultyLevel']): ClinicalCase[] {
    return CLINICAL_CASES.filter(c => c.difficultyLevel === level);
}

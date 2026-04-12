import {
    ClinicalCase,
    CLINICAL_CASES,
    CLINICAL_CASES_MAP,
    getCasesByCategory,
    getCasesByDifficulty,
} from './clinical-cases.data';
import { PatientCalculatorService } from './patient-calculator.service';
import { PatientModel } from './patient.types';

export interface CaseSummary {
    id: string;
    title: string;
    description: string;
    difficultyLevel: ClinicalCase['difficultyLevel'];
    category: ClinicalCase['category'];
    learningObjectives: string[];
    estimatedDurationMinutes: number;
}

export class ClinicalCasesService {
    constructor(private readonly calculator: PatientCalculatorService) {}

    /**
     * Retorna todos los casos clínicos disponibles
     */
    getAllCases(): ClinicalCase[] {
        return CLINICAL_CASES;
    }

    /**
     * Retorna un caso por su ID.
     * @throws Error si el ID no existe
     */
    getCaseById(id: string): ClinicalCase {
        const clinicalCase = CLINICAL_CASES_MAP.get(id);
        if (!clinicalCase) {
            throw new Error(`Caso clínico '${id}' no encontrado`);
        }
        return clinicalCase;
    }

    /**
     * Filtra casos por categoría clínica
     */
    getCasesByCategory(category: ClinicalCase['category']): ClinicalCase[] {
        return getCasesByCategory(category);
    }

    /**
     * Filtra casos por nivel de dificultad
     */
    getCasesByDifficulty(level: ClinicalCase['difficultyLevel']): ClinicalCase[] {
        return getCasesByDifficulty(level);
    }

    /**
     * Construye un PatientModel completo a partir de un caso clínico.
     * Calcula automáticamente IBW, BMI, BSA y volumen tidal predicho.
     */
    createPatientFromCase(caseId: string): PatientModel {
        const clinicalCase = this.getCaseById(caseId);
        const { patient } = clinicalCase;

        const calculated = this.calculator.calculatePatientParams(patient.demographics);

        return {
            id: crypto.randomUUID(),
            demographics: patient.demographics,
            calculated,
            respiratoryMechanics: patient.respiratoryMechanics,
            condition: patient.condition,
            vitalSigns: patient.vitalSigns,
            arterialBloodGas: patient.arterialBloodGas,
            physicalExam: patient.physicalExam,
            diagnosis: patient.diagnosis,
            difficultyLevel: patient.difficultyLevel,
            createdAt: Date.now(),
        };
    }

    /**
     * Resumen ligero de un caso (sin datos completos del paciente).
     * Útil para listados y tarjetas de selección en el frontend.
     */
    getCaseSummary(caseId: string): CaseSummary {
        const c = this.getCaseById(caseId);
        return {
            id: c.id,
            title: c.title,
            description: c.description,
            difficultyLevel: c.difficultyLevel,
            category: c.category,
            learningObjectives: c.learningObjectives,
            estimatedDurationMinutes: c.estimatedDurationMinutes,
        };
    }

    /**
     * Resúmenes de todos los casos, opcionalmente filtrados
     */
    getAllSummaries(filters?: {
        category?: ClinicalCase['category'];
        difficultyLevel?: ClinicalCase['difficultyLevel'];
    }): CaseSummary[] {
        let cases = CLINICAL_CASES;

        if (filters?.category) {
            cases = cases.filter(c => c.category === filters.category);
        }
        if (filters?.difficultyLevel) {
            cases = cases.filter(c => c.difficultyLevel === filters.difficultyLevel);
        }

        return cases.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            difficultyLevel: c.difficultyLevel,
            category: c.category,
            learningObjectives: c.learningObjectives,
            estimatedDurationMinutes: c.estimatedDurationMinutes,
        }));
    }
}

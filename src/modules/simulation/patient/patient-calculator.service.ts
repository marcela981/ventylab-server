import {
    PatientDemographics,
    PatientCalculatedParams,
    PatientCondition,
    RespiratoryMechanics,
    Gender,
} from './patient.types';
import {
    NORMAL_RESPIRATORY_MECHANICS,
    CONDITION_MECHANICS,
} from './patient.constants';

export class PatientCalculatorService {

    /**
     * Calcula peso corporal ideal usando fórmula ARDSNet
     * Hombres: 50 + 0.91 × (altura[cm] - 152.4)
     * Mujeres: 45.5 + 0.91 × (altura[cm] - 152.4)
     */
    calculateIdealBodyWeight(height: number, gender: Gender): number {
        const baseWeight = gender === 'M' ? 50 : 45.5;
        const ibw = baseWeight + 0.91 * (height - 152.4);
        return Math.max(ibw, 30); // Mínimo 30kg para adultos
    }

    /**
     * Calcula IMC
     */
    calculateBMI(weight: number, height: number): number {
        const heightM = height / 100;
        return weight / (heightM * heightM);
    }

    /**
     * Calcula superficie corporal (fórmula DuBois)
     * BSA = 0.007184 × peso^0.425 × altura^0.725
     */
    calculateBodySurfaceArea(weight: number, height: number): number {
        return 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
    }

    /**
     * Calcula rango de volumen tidal predicho (6-8 ml/kg IBW)
     * Según recomendaciones ARDSNet para ventilación protectora
     */
    calculatePredictedTidalVolume(ibw: number): { min: number; max: number } {
        return {
            min: Math.round(ibw * 6),  // 6 ml/kg IBW (conservador)
            max: Math.round(ibw * 8),  // 8 ml/kg IBW (límite superior)
        };
    }

    /**
     * Genera todos los parámetros calculados para un paciente
     */
    calculatePatientParams(demographics: PatientDemographics): PatientCalculatedParams {
        const ibw = this.calculateIdealBodyWeight(demographics.height, demographics.gender);

        return {
            idealBodyWeight: Math.round(ibw * 10) / 10,
            bmi: Math.round(this.calculateBMI(demographics.weight, demographics.height) * 10) / 10,
            predictedTidalVolume: this.calculatePredictedTidalVolume(ibw),
            bodySurfaceArea: Math.round(this.calculateBodySurfaceArea(demographics.weight, demographics.height) * 100) / 100,
        };
    }

    /**
     * Obtiene mecánica respiratoria según condición
     * Mezcla valores normales con modificadores de la condición
     */
    getRespiratoryMechanics(condition: PatientCondition): RespiratoryMechanics {
        const conditionMods = CONDITION_MECHANICS[condition] || {};

        return {
            ...NORMAL_RESPIRATORY_MECHANICS,
            ...conditionMods,
        };
    }

    /**
     * Ajusta mecánica respiratoria por edad y peso
     * Los pacientes muy ancianos o muy obesos tienen compliance reducida
     */
    adjustMechanicsForDemographics(
        mechanics: RespiratoryMechanics,
        demographics: PatientDemographics,
    ): RespiratoryMechanics {
        let { compliance, resistance, functionalResidualCapacity } = { ...mechanics };

        // Reducción de compliance con edad (después de 60 años)
        if (demographics.age > 60) {
            const ageReduction = (demographics.age - 60) * 0.5; // -0.5 ml/cmH2O por año
            compliance = Math.max(compliance - ageReduction, 15);
        }

        // Reducción de compliance y FRC por obesidad
        const bmi = this.calculateBMI(demographics.weight, demographics.height);
        if (bmi > 30) {
            const obesityFactor = 1 - ((bmi - 30) * 0.01); // -1% por cada punto de BMI sobre 30
            compliance = Math.max(compliance * obesityFactor, 15);
            functionalResidualCapacity = Math.max(functionalResidualCapacity * obesityFactor, 1500);
        }

        return {
            compliance: Math.round(compliance * 10) / 10,
            resistance: Math.round(resistance * 10) / 10,
            functionalResidualCapacity: Math.round(functionalResidualCapacity),
            intrinsicPeep: mechanics.intrinsicPeep,
        };
    }
}

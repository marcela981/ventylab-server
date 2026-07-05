import { PatientCalculatorService } from '../patient/patient-calculator.service';
import { PatientCondition } from '../patient/patient.types';

describe('PatientCalculatorService', () => {
    let service: PatientCalculatorService;

    beforeEach(() => {
        service = new PatientCalculatorService();
    });

    // --------------------------------------------------------------------------
    // calculateIdealBodyWeight()
    // --------------------------------------------------------------------------

    describe('calculateIdealBodyWeight', () => {
        it('calcula IBW para hombre de 170cm', () => {
            const ibw = service.calculateIdealBodyWeight(170, 'M');
            expect(ibw).toBeCloseTo(66.0, 1); // 50 + 0.91*(170-152.4)
        });

        it('calcula IBW para mujer de 160cm', () => {
            const ibw = service.calculateIdealBodyWeight(160, 'F');
            expect(ibw).toBeCloseTo(52.4, 1); // 45.5 + 0.91*(160-152.4)
        });

        it('no retorna valores menores a 30kg', () => {
            const ibw = service.calculateIdealBodyWeight(100, 'F');
            expect(ibw).toBeGreaterThanOrEqual(30);
        });
    });

    // --------------------------------------------------------------------------
    // calculateBMI()
    // --------------------------------------------------------------------------

    describe('calculateBMI', () => {
        it('calcula BMI correctamente para peso y altura normales', () => {
            // 70kg, 170cm → 70 / (1.7^2) ≈ 24.22
            const bmi = service.calculateBMI(70, 170);
            expect(bmi).toBeCloseTo(24.22, 1);
        });

        it('calcula BMI para paciente obeso', () => {
            // 120kg, 165cm → 120 / (1.65^2) ≈ 44.08
            const bmi = service.calculateBMI(120, 165);
            expect(bmi).toBeCloseTo(44.08, 1);
        });
    });

    // --------------------------------------------------------------------------
    // calculateBodySurfaceArea()
    // --------------------------------------------------------------------------

    describe('calculateBodySurfaceArea', () => {
        it('calcula BSA con fórmula DuBois', () => {
            // 70kg, 170cm → ~1.82 m²
            const bsa = service.calculateBodySurfaceArea(70, 170);
            expect(bsa).toBeCloseTo(1.82, 1);
        });
    });

    // --------------------------------------------------------------------------
    // calculatePredictedTidalVolume()
    // --------------------------------------------------------------------------

    describe('calculatePredictedTidalVolume', () => {
        it('calcula rango 6-8 ml/kg IBW', () => {
            const ibw = 70;
            const tv = service.calculatePredictedTidalVolume(ibw);
            expect(tv.min).toBe(420);  // 70 * 6
            expect(tv.max).toBe(560);  // 70 * 8
        });

        it('redondea valores correctamente', () => {
            const ibw = 52.4;
            const tv = service.calculatePredictedTidalVolume(ibw);
            expect(tv.min).toBe(Math.round(52.4 * 6));
            expect(tv.max).toBe(Math.round(52.4 * 8));
        });
    });

    // --------------------------------------------------------------------------
    // calculatePatientParams()
    // --------------------------------------------------------------------------

    describe('calculatePatientParams', () => {
        it('genera todos los parámetros para un paciente adulto', () => {
            const params = service.calculatePatientParams({
                weight: 80,
                height: 175,
                age: 45,
                gender: 'M',
            });

            expect(params.idealBodyWeight).toBeGreaterThan(0);
            expect(params.bmi).toBeGreaterThan(0);
            expect(params.predictedTidalVolume.min).toBeLessThan(params.predictedTidalVolume.max);
            expect(params.bodySurfaceArea).toBeGreaterThan(0);
        });

        it('IBW y tidal volume son coherentes', () => {
            const params = service.calculatePatientParams({
                weight: 70,
                height: 170,
                age: 30,
                gender: 'M',
            });

            // Tidal volume debe ser 6-8 * IBW
            expect(params.predictedTidalVolume.min).toBe(Math.round(params.idealBodyWeight * 6));
            expect(params.predictedTidalVolume.max).toBe(Math.round(params.idealBodyWeight * 8));
        });
    });

    // --------------------------------------------------------------------------
    // getRespiratoryMechanics()
    // --------------------------------------------------------------------------

    describe('getRespiratoryMechanics', () => {
        it('retorna valores normales para paciente sano', () => {
            const mech = service.getRespiratoryMechanics(PatientCondition.HEALTHY);
            expect(mech.compliance).toBe(75);
            expect(mech.resistance).toBe(3);
            expect(mech.intrinsicPeep).toBe(0);
        });

        it('retorna compliance reducida para ARDS severo', () => {
            const mech = service.getRespiratoryMechanics(PatientCondition.ARDS_SEVERE);
            expect(mech.compliance).toBe(15);
            expect(mech.resistance).toBe(10);
        });

        it('retorna resistencia aumentada para EPOC severo', () => {
            const mech = service.getRespiratoryMechanics(PatientCondition.COPD_SEVERE);
            expect(mech.resistance).toBe(18);
            expect(mech.intrinsicPeep).toBe(8);
        });

        it('retorna resistencia muy alta para asma severo', () => {
            const mech = service.getRespiratoryMechanics(PatientCondition.ASTHMA_SEVERE);
            expect(mech.resistance).toBe(25);
            expect(mech.intrinsicPeep).toBe(8);
        });

        it('retorna FRC reducida para obesidad-hipoventilación', () => {
            const mech = service.getRespiratoryMechanics(PatientCondition.OBESITY_HYPOVENTILATION);
            expect(mech.functionalResidualCapacity).toBe(1800);
        });

        it('retorna compliance normal para neuromuscular (problema es muscular, no pulmonar)', () => {
            const mech = service.getRespiratoryMechanics(PatientCondition.NEUROMUSCULAR);
            expect(mech.compliance).toBe(60);
            expect(mech.resistance).toBe(3); // Resistencia normal
        });
    });

    // --------------------------------------------------------------------------
    // adjustMechanicsForDemographics()
    // --------------------------------------------------------------------------

    describe('adjustMechanicsForDemographics', () => {
        const baseMechanics = {
            compliance: 75,
            resistance: 3,
            functionalResidualCapacity: 2400,
            intrinsicPeep: 0,
        };

        it('no modifica mecánica para paciente joven con peso normal', () => {
            const adjusted = service.adjustMechanicsForDemographics(baseMechanics, {
                weight: 70, height: 170, age: 30, gender: 'M',
            });

            expect(adjusted.compliance).toBe(75);
            expect(adjusted.functionalResidualCapacity).toBe(2400);
        });

        it('reduce compliance con la edad (después de 60)', () => {
            const adjusted = service.adjustMechanicsForDemographics(baseMechanics, {
                weight: 70, height: 170, age: 80, gender: 'M',
            });

            // 80 - 60 = 20 años * 0.5 = 10 de reducción → 75 - 10 = 65
            expect(adjusted.compliance).toBe(65);
        });

        it('reduce compliance y FRC por obesidad (BMI > 30)', () => {
            const adjusted = service.adjustMechanicsForDemographics(baseMechanics, {
                weight: 120, height: 165, age: 40, gender: 'M',
            });

            expect(adjusted.compliance).toBeLessThan(75);
            expect(adjusted.functionalResidualCapacity).toBeLessThan(2400);
        });

        it('no reduce compliance por debajo de 15', () => {
            const adjusted = service.adjustMechanicsForDemographics(baseMechanics, {
                weight: 200, height: 155, age: 95, gender: 'F',
            });

            expect(adjusted.compliance).toBeGreaterThanOrEqual(15);
        });

        it('no reduce FRC por debajo de 1500', () => {
            const adjusted = service.adjustMechanicsForDemographics(baseMechanics, {
                weight: 200, height: 155, age: 40, gender: 'M',
            });

            expect(adjusted.functionalResidualCapacity).toBeGreaterThanOrEqual(1500);
        });

        it('preserva intrinsicPeep sin cambios', () => {
            const mechWithPeep = { ...baseMechanics, intrinsicPeep: 5 };
            const adjusted = service.adjustMechanicsForDemographics(mechWithPeep, {
                weight: 120, height: 165, age: 75, gender: 'F',
            });

            expect(adjusted.intrinsicPeep).toBe(5);
        });
    });
});

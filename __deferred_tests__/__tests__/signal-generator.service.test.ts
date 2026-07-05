import { SignalGeneratorService } from '../patient/signal-generator.service';
import { PatientModel, PatientCondition } from '../patient/patient.types';
import { VentilatorCommand, VentilationMode } from '../../../../contracts/simulation.contracts';

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------

function makePatient(overrides: Partial<PatientModel['respiratoryMechanics']> = {}): PatientModel {
    return {
        id: 'test-patient',
        demographics: { weight: 70, height: 170, age: 40, gender: 'M' },
        calculated: {
            idealBodyWeight: 66,
            bmi: 24.2,
            predictedTidalVolume: { min: 396, max: 528 },
            bodySurfaceArea: 1.83,
        },
        respiratoryMechanics: {
            compliance: 50,      // ml/cmH2O — normal-ish
            resistance: 5,       // cmH2O/L/s
            functionalResidualCapacity: 2400,
            intrinsicPeep: 0,
            ...overrides,
        },
        condition: PatientCondition.HEALTHY,
        vitalSigns: {
            heartRate: 75,
            respiratoryRate: 15,
            spo2: 98,
            systolicBP: 120,
            diastolicBP: 80,
            temperature: 37,
        },
        difficultyLevel: 'BASIC',
        createdAt: Date.now(),
    };
}

function makeVentSettings(overrides: Partial<VentilatorCommand> = {}): VentilatorCommand {
    return {
        mode: VentilationMode.VCV,
        tidalVolume: 500,        // ml
        respiratoryRate: 15,     // breaths/min → cycle = 4000 ms
        peep: 5,                 // cmH2O
        fio2: 0.4,
        inspiratoryTime: 1.0,    // s → Ti = 1000 ms
        timestamp: Date.now(),
        ...overrides,
    };
}

/**
 * Cycle layout for RR=15, Ti=1.0 s:
 *   0  – 1000 ms  → INSPIRATION
 *   1000 – 1100 ms → INSPIRATORY_PAUSE
 *   1100 – 4000 ms → EXPIRATION
 */
const INSPIRATION_MS = 500;
const PAUSE_MS       = 1050;
const EXPIRATION_MS  = 2000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SignalGeneratorService', () => {
    let service: SignalGeneratorService;

    beforeEach(() => {
        service = new SignalGeneratorService();
    });

    // -----------------------------------------------------------------------
    // generateSignals — shape
    // -----------------------------------------------------------------------

    describe('generateSignals – signal shape', () => {
        it('retorna los cuatro campos obligatorios', () => {
            const patient = makePatient();
            const settings = makeVentSettings();
            const result = service.generateSignals(patient, settings, INSPIRATION_MS);

            expect(result).toHaveProperty('pressure');
            expect(result).toHaveProperty('flow');
            expect(result).toHaveProperty('volume');
            expect(result).toHaveProperty('timestamp');
        });

        it('timestamp es reciente (< 5 s de antigüedad)', () => {
            const patient = makePatient();
            const settings = makeVentSettings();
            const before = Date.now();
            const result = service.generateSignals(patient, settings, INSPIRATION_MS);
            expect(result.timestamp).toBeGreaterThanOrEqual(before);
            expect(result.timestamp).toBeLessThanOrEqual(Date.now());
        });

        it('cycleTimeMs se normaliza — mismos parámetros producen valores similares en ciclos distintos', () => {
            // Bloquear ruido para comparación determinista
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient = makePatient();
            const settings = makeVentSettings();
            const cycleDuration = (60 / settings.respiratoryRate) * 1000; // 4000 ms

            const t1 = service.generateSignals(patient, settings, INSPIRATION_MS);
            const t2 = service.generateSignals(patient, settings, INSPIRATION_MS + cycleDuration);

            expect(t1.pressure).toBeCloseTo(t2.pressure, 5);
            expect(t1.flow).toBeCloseTo(t2.flow, 5);
            expect(t1.volume).toBeCloseTo(t2.volume, 5);

            jest.restoreAllMocks();
        });
    });

    // -----------------------------------------------------------------------
    // Flujo — VCV vs PCV
    // -----------------------------------------------------------------------

    describe('flujo inspiratorio según modo de ventilación', () => {
        it('VCV genera flujo positivo constante durante toda la inspiración', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25); // eliminar ruido

            const patient = makePatient();
            const settings = makeVentSettings({ mode: VentilationMode.VCV });

            const flowEarly  = service.generateSignals(patient, settings, 100).flow;
            const flowMiddle = service.generateSignals(patient, settings, 500).flow;
            const flowLate   = service.generateSignals(patient, settings, 900).flow;

            // Flujo positivo en toda la inspiración
            expect(flowEarly).toBeGreaterThan(0);
            expect(flowMiddle).toBeGreaterThan(0);
            expect(flowLate).toBeGreaterThan(0);

            // Flujo cuadrado: diferencia < 0.01 L/min entre puntos
            expect(Math.abs(flowEarly - flowMiddle)).toBeLessThan(0.01);
            expect(Math.abs(flowMiddle - flowLate)).toBeLessThan(0.01);

            jest.restoreAllMocks();
        });

        it('SIMV genera flujo cuadrado igual que VCV', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient = makePatient();
            const vcvSettings  = makeVentSettings({ mode: VentilationMode.VCV });
            const simvSettings = makeVentSettings({ mode: VentilationMode.SIMV });

            const vcvFlow  = service.generateSignals(patient, vcvSettings,  500).flow;
            const simvFlow = service.generateSignals(patient, simvSettings, 500).flow;

            expect(vcvFlow).toBeCloseTo(simvFlow, 5);
            jest.restoreAllMocks();
        });

        it('PCV genera flujo decelerado: pico > mitad > final', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient = makePatient();
            const settings = makeVentSettings({ mode: VentilationMode.PCV });

            const flowPeak   = service.generateSignals(patient, settings,  50).flow;
            const flowMiddle = service.generateSignals(patient, settings, 500).flow;
            const flowEnd    = service.generateSignals(patient, settings, 950).flow;

            expect(flowPeak).toBeGreaterThan(flowMiddle);
            expect(flowMiddle).toBeGreaterThan(flowEnd);

            jest.restoreAllMocks();
        });

        it('PSV genera flujo decelerado igual que PCV', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient = makePatient();
            const pcvSettings = makeVentSettings({ mode: VentilationMode.PCV });
            const psvSettings = makeVentSettings({ mode: VentilationMode.PSV });

            const flowPCV = service.generateSignals(patient, pcvSettings, 500).flow;
            const flowPSV = service.generateSignals(patient, psvSettings, 500).flow;

            expect(flowPCV).toBeCloseTo(flowPSV, 5);
            jest.restoreAllMocks();
        });

        it('flujo es cero durante la pausa inspiratoria', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient = makePatient();
            const settings = makeVentSettings();

            const result = service.generateSignals(patient, settings, PAUSE_MS);
            expect(result.flow).toBeCloseTo(0, 5);

            jest.restoreAllMocks();
        });

        it('flujo es negativo durante la espiración', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient = makePatient();
            const settings = makeVentSettings();

            const result = service.generateSignals(patient, settings, EXPIRATION_MS);
            expect(result.flow).toBeLessThan(0);

            jest.restoreAllMocks();
        });

        it('flujo espiratorio decae con el tiempo (valor absoluto decrece)', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient = makePatient();
            const settings = makeVentSettings();

            const earlyExp = service.generateSignals(patient, settings, 1200).flow;
            const lateExp  = service.generateSignals(patient, settings, 3000).flow;

            // Ambos negativos; el valor absoluto del temprano debe ser mayor
            expect(Math.abs(earlyExp)).toBeGreaterThan(Math.abs(lateExp));

            jest.restoreAllMocks();
        });
    });

    // -----------------------------------------------------------------------
    // Volumen — coherencia con flujo
    // -----------------------------------------------------------------------

    describe('volumen', () => {
        it('volumen aumenta progresivamente durante inspiración', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient  = makePatient();
            const settings = makeVentSettings();

            const v1 = service.generateSignals(patient, settings, 100).volume;
            const v2 = service.generateSignals(patient, settings, 500).volume;
            const v3 = service.generateSignals(patient, settings, 900).volume;

            expect(v1).toBeLessThan(v2);
            expect(v2).toBeLessThan(v3);

            jest.restoreAllMocks();
        });

        it('volumen máximo al final de la inspiración / durante la pausa', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient  = makePatient();
            const settings = makeVentSettings();
            const tv       = settings.tidalVolume;

            const vPause = service.generateSignals(patient, settings, PAUSE_MS).volume;
            // Sin ruido, debe ser igual al TV configurado
            expect(vPause).toBeCloseTo(tv, 5);

            jest.restoreAllMocks();
        });

        it('volumen disminuye durante espiración', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient  = makePatient();
            const settings = makeVentSettings();

            const vEarlyExp = service.generateSignals(patient, settings, 1200).volume;
            const vLateExp  = service.generateSignals(patient, settings, 3500).volume;

            expect(vEarlyExp).toBeGreaterThan(vLateExp);

            jest.restoreAllMocks();
        });

        it('volumen nunca es negativo', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient  = makePatient();
            const settings = makeVentSettings();

            // Al final de la espiración (justo antes de nuevo ciclo)
            const vEnd = service.generateSignals(patient, settings, 3990).volume;
            expect(vEnd).toBeGreaterThanOrEqual(0);

            jest.restoreAllMocks();
        });
    });

    // -----------------------------------------------------------------------
    // Presión — ecuación del movimiento
    // -----------------------------------------------------------------------

    describe('presión — ecuación del movimiento respiratorio', () => {
        it('presión durante pausa inspiratoria ≈ TV/C + PEEP (componente resistiva nula)', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const mechanics = { compliance: 50, resistance: 5, functionalResidualCapacity: 2400, intrinsicPeep: 0 };
            const patient   = makePatient(mechanics);
            const settings  = makeVentSettings({ peep: 5, tidalVolume: 500 });

            const result = service.generateSignals(patient, settings, PAUSE_MS);

            // Componente elástico: 500 ml / 50 ml/cmH2O = 10 cmH2O
            // Flow = 0 → resistivo = 0
            // Presión esperada ≈ 10 + 0 + 5 = 15 cmH2O
            expect(result.pressure).toBeCloseTo(15, 0);

            jest.restoreAllMocks();
        });

        it('PIP (final inspiración VCV) > Pplateau (pausa) cuando hay resistencia', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const mechanics = { compliance: 50, resistance: 10, functionalResidualCapacity: 2400, intrinsicPeep: 0 };
            const patient   = makePatient(mechanics);
            const settings  = makeVentSettings({ peep: 0, tidalVolume: 500 });

            // Pplateau: final de inspiración con flujo ≈ 0 (sólo elástico = TV/C = 10 cmH2O)
            const plateauResult = service.generateSignals(patient, settings, PAUSE_MS);
            // PIP: justo antes del final de inspiración – elástico alto + resistivo positivo
            // t=900ms → V=450ml → P = 450/50 + (30/60)*10 = 9 + 5 = 14 cmH2O
            const pipResult = service.generateSignals(patient, settings, 900);

            expect(pipResult.pressure).toBeGreaterThan(plateauResult.pressure);

            jest.restoreAllMocks();
        });

        it('presión aumenta con PEEP externo', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patient     = makePatient();
            const lowPeep     = makeVentSettings({ peep: 0 });
            const highPeep    = makeVentSettings({ peep: 10 });

            const pLow  = service.generateSignals(patient, lowPeep,  PAUSE_MS).pressure;
            const pHigh = service.generateSignals(patient, highPeep, PAUSE_MS).pressure;

            expect(pHigh - pLow).toBeCloseTo(10, 0);

            jest.restoreAllMocks();
        });

        it('auto-PEEP intrínseco suma a la presión basal', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patientNormal = makePatient({ intrinsicPeep: 0 });
            const patientCOPD   = makePatient({ intrinsicPeep: 8 });
            const settings      = makeVentSettings({ peep: 5 });

            const pNormal = service.generateSignals(patientNormal, settings, PAUSE_MS).pressure;
            const pCOPD   = service.generateSignals(patientCOPD,   settings, PAUSE_MS).pressure;

            expect(pCOPD - pNormal).toBeCloseTo(8, 0);

            jest.restoreAllMocks();
        });

        it('compliance reducida (ARDS) produce presión pico más alta', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.25);

            const patientNormal = makePatient({ compliance: 50 });
            const patientARDS   = makePatient({ compliance: 15 });
            const settings      = makeVentSettings({ peep: 5 });

            const pNormal = service.generateSignals(patientNormal, settings, PAUSE_MS).pressure;
            const pARDS   = service.generateSignals(patientARDS,   settings, PAUSE_MS).pressure;

            expect(pARDS).toBeGreaterThan(pNormal);

            jest.restoreAllMocks();
        });
    });

    // -----------------------------------------------------------------------
    // SpO2 — delay fisiológico
    // -----------------------------------------------------------------------

    describe('generateSpO2 – delay fisiológico', () => {
        it('SpO2 avanza hacia el objetivo pero no llega en 1 s', () => {
            const patient = makePatient();
            patient.condition = PatientCondition.HEALTHY;

            // Con FiO2 1.0 y paciente sano el objetivo es ~100%
            const previous = 88;
            const result   = service.generateSpO2(patient, 1.0, previous, 1000); // 1 s

            expect(result).toBeGreaterThan(previous);  // avanzó
            expect(result).toBeLessThan(98);           // no llegó al objetivo
        });

        it('SpO2 converge al objetivo tras tiempo largo (>> tau)', () => {
            const patient = makePatient();
            patient.condition = PatientCondition.HEALTHY;

            // 10 minutos >> 30 s de tau
            const result = service.generateSpO2(patient, 0.5, 88, 10 * 60 * 1000);
            const expected = 88 + (0.5 - 0.21) * 15; // ~92.35%
            expect(result).toBeCloseTo(expected, 0);
        });

        it('ARDS severo reduce SpO2 objetivo ~10 pp', () => {
            const healthyPatient = { ...makePatient(), condition: PatientCondition.HEALTHY };
            const ardsPatient    = { ...makePatient(), condition: PatientCondition.ARDS_SEVERE };

            const spo2Healthy = service.generateSpO2(healthyPatient, 0.4, 88, 600_000);
            const spo2ARDS    = service.generateSpO2(ardsPatient,    0.4, 88, 600_000);

            expect(spo2Healthy - spo2ARDS).toBeCloseTo(10, 0);
        });

        it('condición moderada reduce SpO2 objetivo ~5 pp respecto a sano', () => {
            const healthyPatient   = { ...makePatient(), condition: PatientCondition.HEALTHY };
            const moderatePatient  = { ...makePatient(), condition: PatientCondition.ARDS_MODERATE };

            const spo2Healthy   = service.generateSpO2(healthyPatient,  0.4, 88, 600_000);
            const spo2Moderate  = service.generateSpO2(moderatePatient, 0.4, 88, 600_000);

            expect(spo2Healthy - spo2Moderate).toBeCloseTo(5, 0);
        });

        it('SpO2 nunca supera 100%', () => {
            const patient = makePatient();
            patient.condition = PatientCondition.HEALTHY;

            const result = service.generateSpO2(patient, 1.0, 99, 600_000);
            expect(result).toBeLessThanOrEqual(100);
        });

        it('SpO2 nunca baja de 50%', () => {
            const patient = makePatient();
            patient.condition = PatientCondition.ARDS_SEVERE;

            const result = service.generateSpO2(patient, 0.21, 60, 600_000);
            expect(result).toBeGreaterThanOrEqual(50);
        });

        it('SpO2 sube con FiO2 más alto', () => {
            const patient = makePatient();

            const spo2Low  = service.generateSpO2(patient, 0.21, 88, 600_000);
            const spo2High = service.generateSpO2(patient, 1.0,  88, 600_000);

            expect(spo2High).toBeGreaterThan(spo2Low);
        });
    });

    // -----------------------------------------------------------------------
    // Ruido — variabilidad biológica
    // -----------------------------------------------------------------------

    describe('ruido gaussiano', () => {
        it('señales consecutivas difieren por variabilidad de ruido', () => {
            const patient  = makePatient();
            const settings = makeVentSettings();

            const samples = Array.from({ length: 50 }, () =>
                service.generateSignals(patient, settings, PAUSE_MS).pressure,
            );

            const mean    = samples.reduce((a, b) => a + b, 0) / samples.length;
            const hasDiff = samples.some(v => Math.abs(v - mean) > 0.05);
            expect(hasDiff).toBe(true);
        });

        it('presión durante pausa se mantiene dentro de ±5 cmH2O respecto al valor ideal', () => {
            const mechanics = { compliance: 50, resistance: 5, functionalResidualCapacity: 2400, intrinsicPeep: 0 };
            const patient   = makePatient(mechanics);
            const settings  = makeVentSettings({ peep: 5, tidalVolume: 500 });

            // Ideal = 500/50 + 5 = 15 cmH2O; ruido stdDev=0.5 → 3σ ≈ 1.5
            const expectedIdeal = 15;

            for (let i = 0; i < 100; i++) {
                const p = service.generateSignals(patient, settings, PAUSE_MS).pressure;
                expect(p).toBeGreaterThan(expectedIdeal - 5);
                expect(p).toBeLessThan(expectedIdeal + 5);
            }
        });

        it('flujo cuadrado VCV presenta variabilidad pequeña (stdDev ≈ 1 L/min)', () => {
            const patient  = makePatient();
            const settings = makeVentSettings({ mode: VentilationMode.VCV, tidalVolume: 500, inspiratoryTime: 1.0 });

            // Flujo ideal = (0.5 L) / (1/60 min) = 30 L/min; ruido stdDev=1
            const samples = Array.from({ length: 200 }, () =>
                service.generateSignals(patient, settings, INSPIRATION_MS).flow,
            );

            const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
            expect(mean).toBeGreaterThan(25);  // ±5 de tolerancia
            expect(mean).toBeLessThan(35);
        });
    });

    // -----------------------------------------------------------------------
    // Rangos fisiológicos — no out-of-range
    // -----------------------------------------------------------------------

    describe('rangos fisiológicos', () => {
        const conditions = [
            PatientCondition.HEALTHY,
            PatientCondition.ARDS_SEVERE,
            PatientCondition.COPD_SEVERE,
            PatientCondition.ASTHMA_SEVERE,
        ];

        const modes = [VentilationMode.VCV, VentilationMode.PCV];

        test.each(conditions)('presión dentro de rango clínico para %s', (condition) => {
            const patient   = { ...makePatient(), condition };
            const settings  = makeVentSettings();
            const timePoints = [INSPIRATION_MS, PAUSE_MS, EXPIRATION_MS];

            for (const t of timePoints) {
                const { pressure } = service.generateSignals(patient, settings, t);
                // Rango clínico razonable: 0–80 cmH2O
                expect(pressure).toBeGreaterThan(-2);   // puede haber ruido mínimo
                expect(pressure).toBeLessThan(80);
            }
        });

        test.each(modes)('flujo dentro de rango clínico para modo %s', (mode) => {
            const patient   = makePatient();
            const settings  = makeVentSettings({ mode });
            const timePoints = [INSPIRATION_MS, PAUSE_MS, EXPIRATION_MS];

            for (const t of timePoints) {
                const { flow } = service.generateSignals(patient, settings, t);
                // Flujo entre -200 y +200 L/min es clínicamente posible
                expect(Math.abs(flow)).toBeLessThan(200);
            }
        });

        it('volumen dentro de rango [0, TV] durante todo el ciclo', () => {
            const patient  = makePatient();
            const settings = makeVentSettings({ tidalVolume: 500 });
            const times    = [0, 200, 500, PAUSE_MS, 1200, 2000, 3000, 3990];

            for (const t of times) {
                const { volume } = service.generateSignals(patient, settings, t);
                // Tolerancia de ±20 ml por ruido (stdDev=5)
                expect(volume).toBeGreaterThan(-20);
                expect(volume).toBeLessThan(settings.tidalVolume + 20);
            }
        });
    });
});

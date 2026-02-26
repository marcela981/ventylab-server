import { PatientCondition, PatientModel, RespiratoryMechanics } from './patient.types';
import { VentilatorCommand, VentilationMode } from '../../../../contracts/simulation.contracts';

export interface GeneratedSignals {
    pressure: number;   // cmH2O
    flow: number;       // L/min
    volume: number;     // ml
    timestamp: number;
}

interface CyclePhase {
    phase: 'INSPIRATION' | 'INSPIRATORY_PAUSE' | 'EXPIRATION';
    phaseTime: number;      // Tiempo dentro de la fase actual (ms)
    phaseDuration: number;  // Duración total de la fase (ms)
}

export class SignalGeneratorService {

    /**
     * Genera señales para un instante de tiempo dado.
     * cycleTimeMs puede ser absoluto (se normaliza internamente).
     */
    generateSignals(
        patient: PatientModel,
        ventSettings: VentilatorCommand,
        cycleTimeMs: number,
    ): GeneratedSignals {
        const cycleDuration = this.getCycleDuration(ventSettings.respiratoryRate);
        const normalizedTime = cycleTimeMs % cycleDuration;
        const phase = this.getCurrentPhase(normalizedTime, ventSettings, cycleDuration);

        const flow = this.calculateFlow(phase, ventSettings, patient.respiratoryMechanics);
        const volume = this.calculateVolume(phase, ventSettings, cycleDuration);
        const pressure = this.calculatePressure(
            volume,
            flow,
            patient.respiratoryMechanics,
            ventSettings.peep,
        );

        return {
            pressure: this.addNoise(pressure, 0.5),
            flow: this.addNoise(flow, 1),
            volume: this.addNoise(volume, 5),
            timestamp: Date.now(),
        };
    }

    /**
     * Duración del ciclo respiratorio en ms.
     */
    private getCycleDuration(respiratoryRate: number): number {
        return (60 / respiratoryRate) * 1000;
    }

    /**
     * Determina la fase actual del ciclo y el tiempo transcurrido dentro de ella.
     */
    private getCurrentPhase(
        timeInCycle: number,
        settings: VentilatorCommand,
        cycleDuration: number,
    ): CyclePhase {
        const inspiratoryTime = (settings.inspiratoryTime ?? 1.0) * 1000; // ms
        const pauseTime = 100; // ms — pausa inspiratoria fija
        const pauseEnd = inspiratoryTime + pauseTime;

        if (timeInCycle < inspiratoryTime) {
            return {
                phase: 'INSPIRATION',
                phaseTime: timeInCycle,
                phaseDuration: inspiratoryTime,
            };
        } else if (timeInCycle < pauseEnd) {
            return {
                phase: 'INSPIRATORY_PAUSE',
                phaseTime: timeInCycle - inspiratoryTime,
                phaseDuration: pauseTime,
            };
        } else {
            return {
                phase: 'EXPIRATION',
                phaseTime: timeInCycle - pauseEnd,
                phaseDuration: cycleDuration - pauseEnd,
            };
        }
    }

    /**
     * Calcula flujo según modo de ventilación y fase.
     */
    private calculateFlow(
        phase: CyclePhase,
        settings: VentilatorCommand,
        mechanics: RespiratoryMechanics,
    ): number {
        switch (phase.phase) {
            case 'INSPIRATION':
                return this.calculateInspiratoryFlow(phase, settings, settings.mode);
            case 'INSPIRATORY_PAUSE':
                return 0;
            case 'EXPIRATION':
                return this.calculateExpiratoryFlow(phase, settings, mechanics);
        }
    }

    /**
     * Flujo inspiratorio según modo de ventilación.
     * VCV/SIMV: flujo cuadrado (constante).
     * PCV/PSV:  flujo decelerado exponencial.
     */
    private calculateInspiratoryFlow(
        phase: CyclePhase,
        settings: VentilatorCommand,
        mode: VentilationMode,
    ): number {
        const tidalVolume = settings.tidalVolume; // ml
        const inspiratoryTimeSec = phase.phaseDuration / 1000; // s

        if (mode === VentilationMode.VCV || mode === VentilationMode.SIMV) {
            // Flujo cuadrado: (TV [L]) / (Ti [min])
            return (tidalVolume / 1000) / (inspiratoryTimeSec / 60);
        } else {
            // PCV/PSV: pico inicial alto que decae exponencialmente
            const progress = phase.phaseTime / phase.phaseDuration;
            const peakFlow = (tidalVolume / 1000) / (inspiratoryTimeSec / 60) * 1.5;
            const tau = 0.3; // constante de tiempo adimensional
            return peakFlow * Math.exp(-progress / tau);
        }
    }

    /**
     * Flujo espiratorio: siempre pasivo, decaimiento exponencial.
     * La constante de tiempo fisiológica es τ = C × R.
     */
    private calculateExpiratoryFlow(
        phase: CyclePhase,
        settings: VentilatorCommand,
        mechanics: RespiratoryMechanics,
    ): number {
        const progress = phase.phaseTime / phase.phaseDuration;
        const tidalVolume = settings.tidalVolume;
        const expiratoryTimeSec = phase.phaseDuration / 1000;

        // τ fisiológico = C [L/cmH2O] × R [cmH2O·s/L]
        const tau = (mechanics.compliance / 1000) * mechanics.resistance;
        const tauNormalized = tau / expiratoryTimeSec;

        // Pico espiratorio negativo
        const peakExpFlow = -(tidalVolume / 1000) / (expiratoryTimeSec / 60) * 1.5;
        return peakExpFlow * Math.exp(-progress / Math.max(tauNormalized, 0.2));
    }

    /**
     * Calcula volumen como integral simplificada del flujo.
     * Inspiración: rampa lineal. Pausa: máximo. Espiración: declive lineal.
     */
    private calculateVolume(
        phase: CyclePhase,
        settings: VentilatorCommand,
        _cycleDuration: number,
    ): number {
        const progress = phase.phaseTime / phase.phaseDuration;
        const tidalVolume = settings.tidalVolume;

        switch (phase.phase) {
            case 'INSPIRATION':
                return tidalVolume * progress;
            case 'INSPIRATORY_PAUSE':
                return tidalVolume;
            case 'EXPIRATION':
                return Math.max(0, tidalVolume * (1 - progress));
        }
    }

    /**
     * Presión en vía aérea usando la ecuación del movimiento respiratorio:
     * Paw = (V / C) + (Flow_L/s × R) + PEEP_total
     */
    private calculatePressure(
        volume: number,
        flow: number,
        mechanics: RespiratoryMechanics,
        peep: number,
    ): number {
        const { compliance, resistance, intrinsicPeep } = mechanics;

        const elasticPressure = volume / compliance;          // cmH2O
        const flowLs = flow / 60;                            // L/min → L/s
        const resistivePressure = flowLs * resistance;        // cmH2O
        const totalPeep = peep + intrinsicPeep;              // cmH2O

        return elasticPressure + resistivePressure + totalPeep;
    }

    /**
     * Añade ruido gaussiano (Box-Muller) para simular variabilidad fisiológica.
     */
    private addNoise(value: number, stdDev: number): number {
        // Box-Muller transform — never feed log(0)
        const u1 = Math.max(Math.random(), Number.EPSILON);
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return value + z * stdDev;
    }

    // -------------------------------------------------------------------------
    // SpO2
    // -------------------------------------------------------------------------

    /**
     * Genera SpO2 con delay fisiológico de primer orden (~30 s).
     * @param patient      - Modelo del paciente
     * @param fio2         - Fracción inspirada de O2 (0.21–1.0)
     * @param previousSpo2 - Último valor conocido de SpO2
     * @param deltaTimeMs  - Tiempo transcurrido desde el último ciclo (ms)
     */
    generateSpO2(
        patient: PatientModel,
        fio2: number,
        previousSpo2: number,
        deltaTimeMs: number,
    ): number {
        const targetSpo2 = this.calculateTargetSpO2(fio2, patient.condition);

        // Constante de tiempo: 30 s
        const tau = 30_000;
        const alpha = 1 - Math.exp(-deltaTimeMs / tau);

        const newSpo2 = previousSpo2 + alpha * (targetSpo2 - previousSpo2);
        return Math.min(100, Math.max(50, newSpo2));
    }

    /**
     * SpO2 objetivo según FiO2 y severidad de la condición.
     * Base: 88% con FiO2 0.21, sube ~15 pp al 100% de FiO2.
     */
    private calculateTargetSpO2(fio2: number, condition: PatientCondition): number {
        let baseSpo2 = 88 + (fio2 - 0.21) * 15;

        // El string del enum contiene la severidad (e.g. 'ARDS_SEVERE')
        const condStr = condition as string;
        if (condStr.includes('SEVERE')) {
            baseSpo2 -= 10;
        } else if (condStr.includes('MODERATE')) {
            baseSpo2 -= 5;
        }

        return Math.min(100, Math.max(70, baseSpo2));
    }
}

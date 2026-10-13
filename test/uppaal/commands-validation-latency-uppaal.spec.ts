/*
 * Funcionalidad: Propiedad S5 del modelo UPPAAL de comandos como prueba ejecutable
 * Descripción: Mide con el reloj real la validación de comandos del ventilador (validateVentilatorCommand con los límites de seguridad por defecto) sobre entradas pseudoaleatorias con semilla, válidas e inválidas, y comprueba que el p99 tras el calentamiento no supera los 5 ms de apiGateway.t_gate
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DEFAULT_VENTILATOR_SAFETY_LIMITS } from "@/features/ventilator-commands/domain/validation/ventilator-command-safety-limits";
import { validateVentilatorCommand, type VentilatorCommandValidation } from "@/features/ventilator-commands/domain/validation/ventilator-command-validator";

const MODEL_GATE_BUDGET_MS: number = 5;
const SAMPLES: number = 2000;
const WARM_UP: number = 100;
const SEED: number = 20261013;

function seededRandom(seed: number): () => number {
  let state: number = seed >>> 0;

  return (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;

    return state / 0x100000000;
  };
}

function randomField(random: () => number, low: number, high: number): unknown {
  const pick: number = random();

  if (pick < 0.1) {
    return Number.NaN;
  }

  if (pick < 0.15) {
    return "12";
  }

  return low + random() * (high - low) * 1.5;
}

function randomCommand(random: () => number): Record<string, unknown> {
  if (random() < 0.5) {
    return { mode: "VCV", tidalVolume: randomField(random, 100, 800), respiratoryRate: randomField(random, 5, 40), peep: randomField(random, 0, 20), fio2: randomField(random, 0.21, 1) };
  }

  return {
    mode: "PCV",
    pressureLimit: randomField(random, 5, 40),
    respiratoryRate: randomField(random, 5, 40),
    peep: randomField(random, 0, 20),
    fio2: randomField(random, 0.21, 1),
    inspiratoryTime: randomField(random, 0.3, 3),
  };
}

describe("UPPAAL commands model (ventilab-commands-uppaal.xml, corrected-v2) S5 as an executable property", () => {
  describe("S5 A[] apiGateway.VALIDATING_REQUEST imply apiGateway.t_gate <= 5", () => {
    it("validates 2000 seeded random valid and invalid commands with a p99 at or below 5 ms after warm-up", () => {
      const random: () => number = seededRandom(SEED);
      const durations: number[] = [];
      let accepted: number = 0;

      for (let index: number = 0; index < SAMPLES + WARM_UP; index += 1) {
        const command: Record<string, unknown> = randomCommand(random);
        const startedAt: number = performance.now();
        const validation: VentilatorCommandValidation = validateVentilatorCommand(command, DEFAULT_VENTILATOR_SAFETY_LIMITS);
        const elapsed: number = performance.now() - startedAt;

        if (index >= WARM_UP) {
          durations.push(elapsed);
          accepted += validation.valid ? 1 : 0;
        }
      }

      const sorted: number[] = [...durations].sort((left: number, right: number): number => left - right);
      const p99: number = sorted[Math.ceil(0.99 * sorted.length) - 1];

      expect(accepted).toBeGreaterThan(0);
      expect(accepted).toBeLessThan(SAMPLES);
      expect(p99).toBeLessThanOrEqual(MODEL_GATE_BUDGET_MS);
    });
  });
});

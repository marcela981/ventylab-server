/*
 * Funcionalidad: Pruebas del detector de huecos de secuencia
 * Descripción: Verifica que los saltos hacia adelante sumen pérdidas, que las tramas tardías dentro de la ventana de reordenamiento se cuenten como reordenadas sin pérdidas falsas ni reinicio de la referencia, que un retroceso grande reinicie la referencia (reinicio del dispositivo) y que la secuencia de 16 o 32 bits pueda dar la vuelta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type SequenceObservation, SequenceGapTracker, type SequenceWrapBits } from "@/features/ventilator-telemetry/domain/services/sequence-gap-tracker";

interface Totals {
  readonly lost: number;
  readonly reordered: number;
  readonly restarts: number;
}

function observeAll(tracker: SequenceGapTracker, sequence: readonly number[]): Totals {
  const observations: SequenceObservation[] = sequence.map((seq: number): SequenceObservation => tracker.observe(seq));

  return {
    lost: observations.reduce((sum: number, observation: SequenceObservation): number => sum + observation.lost, 0),
    reordered: observations.filter((observation: SequenceObservation): boolean => observation.reordered).length,
    restarts: observations.filter((observation: SequenceObservation): boolean => observation.restarted).length,
  };
}

describe("SequenceGapTracker", () => {
  it("counts gap - 1 lost messages on forward jumps", () => {
    expect(observeAll(new SequenceGapTracker(), [1, 2, 5, 6, 10])).toEqual({ lost: 5, reordered: 0, restarts: 0 });
  });

  it("ignores frames without a sequence number", () => {
    const tracker: SequenceGapTracker = new SequenceGapTracker();

    expect(tracker.observe(undefined)).toEqual({ lost: 0, reordered: false, restarted: false });
  });

  it("counts a late frame inside the reorder window as reordered without false losses", () => {
    expect(observeAll(new SequenceGapTracker(), [10, 8, 11])).toEqual({ lost: 0, reordered: 1, restarts: 0 });
  });

  it("keeps the baseline after a late frame so the next gap is measured from the newest frame", () => {
    expect(observeAll(new SequenceGapTracker(), [1, 2, 5, 3, 4, 10])).toEqual({ lost: 6, reordered: 2, restarts: 0 });
  });

  it("treats a repeated sequence number as reordered", () => {
    expect(observeAll(new SequenceGapTracker(), [7, 7, 8])).toEqual({ lost: 0, reordered: 1, restarts: 0 });
  });

  it("resets the baseline on a backward jump beyond the reorder window (device restart)", () => {
    expect(observeAll(new SequenceGapTracker({ reorderWindow: 16 }), [500, 501, 3, 4, 6])).toEqual({ lost: 1, reordered: 0, restarts: 1 });
  });

  it("honours a configured reorder window", () => {
    expect(observeAll(new SequenceGapTracker({ reorderWindow: 2 }), [10, 7, 8])).toEqual({ lost: 0, reordered: 0, restarts: 1 });
    expect(observeAll(new SequenceGapTracker({ reorderWindow: 3 }), [10, 7, 11])).toEqual({ lost: 0, reordered: 1, restarts: 0 });
  });

  it.each([
    [16, 65_535],
    [32, 4_294_967_295],
  ])("continues across the %i-bit wraparound and counts the frames lost while wrapping", (bits: number, max: number) => {
    const tracker: SequenceGapTracker = new SequenceGapTracker({ wrapBits: bits as SequenceWrapBits });

    expect(observeAll(tracker, [max - 2, max - 1, max, 0, 1, 4])).toEqual({ lost: 2, reordered: 0, restarts: 0 });
  });

  it("counts a frame from before the wraparound that arrives after it as reordered", () => {
    expect(observeAll(new SequenceGapTracker({ wrapBits: 16 }), [65_534, 1, 65_535, 2])).toEqual({ lost: 2, reordered: 1, restarts: 0 });
  });

  it("still treats a jump to 0 from far below the maximum as a restart when wrapping is enabled", () => {
    expect(observeAll(new SequenceGapTracker({ wrapBits: 16 }), [40_000, 0, 1])).toEqual({ lost: 0, reordered: 0, restarts: 1 });
  });

  it("treats a jump to 0 from the maximum as a restart when wrapping is disabled", () => {
    expect(observeAll(new SequenceGapTracker(), [65_535, 0, 1])).toEqual({ lost: 0, reordered: 0, restarts: 1 });
  });
});

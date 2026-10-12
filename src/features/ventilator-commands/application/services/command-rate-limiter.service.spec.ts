/*
 * Funcionalidad: Pruebas del limitador de frecuencia de comandos
 * Descripción: Verifica que el limitador usa la frecuencia vigente de los ajustes y que un cambio de frecuencia se aplica al siguiente comando del usuario sin reiniciar
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CommandRateLimiterService } from "@/features/ventilator-commands/application/services/command-rate-limiter.service";
import { testCommandsSettings } from "@/features/ventilator-commands/application/testing/ventilator-commands-test-doubles-spec";
import { type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";

function limiterWithRate(initialRate: number): { limiter: CommandRateLimiterService; setRate: (rate: number) => void } {
  let ratePerSecond: number = initialRate;
  const settings: VentilatorCommandsSettings = {
    ...testCommandsSettings(),
    get ratePerSecond(): number {
      return ratePerSecond;
    },
  };

  return {
    limiter: new CommandRateLimiterService(settings),
    setRate: (rate: number): void => {
      ratePerSecond = rate;
    },
  };
}

describe("CommandRateLimiterService", () => {
  it("applies a changed rate to the next command without a restart and without refilling the bucket", () => {
    const { limiter, setRate } = limiterWithRate(1);

    const firstWaits: number[] = [limiter.tryConsume("user-1", 0), limiter.tryConsume("user-1", 0)];

    setRate(3);

    const waitAfterChange: number = limiter.tryConsume("user-1", 0);
    const laterWaits: number[] = [limiter.tryConsume("user-1", 1000), limiter.tryConsume("user-1", 1000), limiter.tryConsume("user-1", 1000), limiter.tryConsume("user-1", 1000)];

    expect(firstWaits).toEqual([0, 1000]);
    expect(waitAfterChange).toBe(334);
    expect(laterWaits).toEqual([0, 0, 0, 334]);
  });

  it("caps the current tokens at the new capacity when the rate drops", () => {
    const { limiter, setRate } = limiterWithRate(5);

    limiter.tryConsume("user-1", 0);
    setRate(2);

    const waits: number[] = [limiter.tryConsume("user-1", 0), limiter.tryConsume("user-1", 0), limiter.tryConsume("user-1", 0)];

    expect(waits).toEqual([0, 0, 500]);
  });
});

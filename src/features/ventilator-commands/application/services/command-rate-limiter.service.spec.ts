/*
 * Funcionalidad: Pruebas del limitador de frecuencia de comandos
 * Descripción: Verifica que el limitador usa la frecuencia vigente de los ajustes y que un cambio de frecuencia se aplica al siguiente comando del usuario sin reiniciar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CommandRateLimiterService } from "@/features/ventilator-commands/application/services/command-rate-limiter.service";
import { testCommandsSettings } from "@/features/ventilator-commands/application/testing/ventilator-commands-test-doubles-spec";
import { type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";

describe("CommandRateLimiterService", () => {
  it("applies a changed rate to the next command without a restart", () => {
    let ratePerSecond: number = 1;
    const settings: VentilatorCommandsSettings = {
      ...testCommandsSettings(),
      get ratePerSecond(): number {
        return ratePerSecond;
      },
    };
    const limiter: CommandRateLimiterService = new CommandRateLimiterService(settings);

    const firstWaits: number[] = [limiter.tryConsume("user-1", 0), limiter.tryConsume("user-1", 0)];

    ratePerSecond = 3;

    const secondWaits: number[] = [limiter.tryConsume("user-1", 0), limiter.tryConsume("user-1", 0), limiter.tryConsume("user-1", 0), limiter.tryConsume("user-1", 0)];

    expect(firstWaits).toEqual([0, 1000]);
    expect(secondWaits).toEqual([0, 0, 0, 334]);
  });
});

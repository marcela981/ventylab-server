/*
 * Funcionalidad: Pruebas del ciclo de vida de los comandos del ventilador
 * Descripción: Verifica que al destruirse el módulo (antes de que Prisma se desconecte) los comandos enviados se resuelvan como TIMEOUT y su persistencia termine antes de devolver el control
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createVentilatorCommandsHarness, type VentilatorCommandsHarness } from "@/features/ventilator-commands/application/testing/ventilator-commands-test-doubles-spec";
import { VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { VentilatorCommandsLifecycleService } from "@/features/ventilator-commands/infrastructure/lifecycle/ventilator-commands-lifecycle.service";

describe("VentilatorCommandsLifecycleService", () => {
  it("persists the shutdown transitions of sent commands before the module is destroyed", async () => {
    const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness();
    const command: VentilatorCommand = VentilatorCommand.create({
      correlationId: "cmd-1",
      reservationId: "res-1",
      userId: "student-1",
      params: { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 },
      encoding: "json",
      encodedPayload: "{}",
      now: new Date(),
    });

    harness.lifecycle.recordSent(command);

    await new VentilatorCommandsLifecycleService(harness.control, harness.lifecycle).onModuleDestroy();

    expect(harness.repository.writes.map((write: VentilatorCommand): string => write.status)).toEqual(["SENT", "TIMEOUT"]);
  });
});

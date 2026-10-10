/*
 * Funcionalidad: Pruebas del adaptador heredado POST /api/simulation/command
 * Descripción: Verifica que los caminos sintéticos (ajuste y arranque del paciente simulado) no toquen el ventilador físico y que el camino físico delegue en VentilatorCommandsFacade con el usuario, su rol y el comando sin validar, conservando la forma del resultado heredado y propagando sus errores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SendVentilatorCommandCommand } from "@/features/simulation/application/commands/send-ventilator-command.command";
import { type SendVentilatorCommandResult } from "@/features/simulation/application/results/send-ventilator-command.result";
import { type PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { SendVentilatorCommandUseCase } from "@/features/simulation/application/use-cases/send-ventilator-command.usecase";
import { type VentilatorCommand } from "@/features/simulation/domain/value-objects/ventilator-command";
import { SentVentilatorCommandResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import { type VentilatorCommandSendInput, type VentilatorCommandsFacade } from "@/features/ventilator-commands/application/services/ventilator-commands.facade";
import { NotVentilatorOperatorError } from "@/features/ventilator-commands/domain/ventilator-commands.errors";

const COMMAND: VentilatorCommand = { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 };
const SENT_AT: Date = new Date("2026-10-10T12:00:00.000Z");

class FakePatientSessions {
  public simulating: boolean = false;
  public hasPatient: boolean = false;
  public readonly calls: string[] = [];

  public isSimulating(): boolean {
    return this.simulating;
  }

  public getActivePatient(): object | undefined {
    return this.hasPatient ? {} : undefined;
  }

  public updateCommand(): void {
    this.calls.push("update");
  }

  public start(): void {
    this.calls.push("start");
  }
}

class FakeCommandsFacade {
  public readonly inputs: VentilatorCommandSendInput[] = [];
  public error: Error | undefined;

  public async send(input: VentilatorCommandSendInput): Promise<SentVentilatorCommandResult> {
    this.inputs.push(input);

    if (this.error) {
      throw this.error;
    }

    return await Promise.resolve(new SentVentilatorCommandResult({ commandId: "cmd-1", reservationId: "res-1", status: "SENT", sentAt: SENT_AT }));
  }
}

function build(): { useCase: SendVentilatorCommandUseCase; sessions: FakePatientSessions; facade: FakeCommandsFacade } {
  const sessions: FakePatientSessions = new FakePatientSessions();
  const facade: FakeCommandsFacade = new FakeCommandsFacade();

  return {
    useCase: new SendVentilatorCommandUseCase(facade as unknown as VentilatorCommandsFacade, sessions as unknown as PatientSimulationSessionsService),
    sessions,
    facade,
  };
}

function command(): SendVentilatorCommandCommand {
  return new SendVentilatorCommandCommand({ userId: "student-1", userRole: "STUDENT", command: COMMAND });
}

describe("legacy simulation command adapter", () => {
  it("keeps the synthetic paths away from the physical ventilator", async () => {
    const { useCase, sessions, facade } = build();

    sessions.simulating = true;
    const update: SendVentilatorCommandResult = await useCase.execute(command());
    sessions.simulating = false;
    sessions.hasPatient = true;
    const start: SendVentilatorCommandResult = await useCase.execute(command());

    expect([update.target, start.target]).toEqual(["synthetic_update", "synthetic_start"]);
    expect(sessions.calls).toEqual(["update", "start"]);
    expect(facade.inputs).toHaveLength(0);
  });

  it("delegates the physical path to the ventilator commands facade with the legacy result shape", async () => {
    const { useCase, facade } = build();

    const result: SendVentilatorCommandResult = await useCase.execute(command());

    expect(facade.inputs).toEqual([{ userId: "student-1", role: "STUDENT", params: COMMAND }]);
    expect(result).toEqual({ commandId: "cmd-1", target: "physical", timestamp: SENT_AT.getTime() });
  });

  it("propagates the facade errors", async () => {
    const { useCase, facade } = build();

    facade.error = new NotVentilatorOperatorError();

    await expect(useCase.execute(command())).rejects.toBeInstanceOf(NotVentilatorOperatorError);
  });
});

/*
 * Funcionalidad: Pruebas de ListTelemetryRecordingsUseCase
 * Descripción: Verifica el rango por defecto de 90 días y el rechazo de rangos inválidos o de más de 366 días, que el usuario lea sus propias grabaciones, que un estudiante no lea las de otro, que el docente pase por el alcance de GroupsFacade y que solo se listen reservas con fragmentos grabados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { StudentOutOfScopeError } from "@/features/groups/domain/groups.errors";
import { ListTelemetryRecordingsCommand } from "@/features/ventilator-telemetry/application/commands/telemetry-recording.command";
import { InMemoryTelemetryChunksRepository } from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";
import { ListTelemetryRecordingsUseCase } from "@/features/ventilator-telemetry/application/use-cases/list-telemetry-recordings.usecase";
import { type TelemetryRecordingSummary } from "@/features/ventilator-telemetry/domain/repositories/telemetry-chunks.repository";
import { TelemetryRecordingForbiddenError, TelemetryRecordingRangeInvalidError } from "@/features/ventilator-telemetry/domain/ventilator-telemetry.errors";

const NOW: Date = new Date("2026-11-03T12:00:00.000Z");
const DAY_MS: number = 24 * 60 * 60 * 1000;

interface Harness {
  readonly useCase: ListTelemetryRecordingsUseCase;
  readonly repository: InMemoryTelemetryChunksRepository;
  readonly groups: { assertCanViewStudent: jest.Mock };
}

function build(): Harness {
  const repository: InMemoryTelemetryChunksRepository = new InMemoryTelemetryChunksRepository();
  const groups: { assertCanViewStudent: jest.Mock } = {
    assertCanViewStudent: jest.fn().mockImplementation((actor: { id: string }) => (actor.id === "teacher-1" ? Promise.resolve({ groupIds: ["group-1"] }) : Promise.reject(new StudentOutOfScopeError()))),
  };

  for (const [id, daysAgo, chunks] of [["recent", 5, 2], ["old", 120, 1], ["empty", 3, 0]] as const) {
    const startsAt: Date = new Date(NOW.getTime() - daysAgo * DAY_MS);

    repository.holders.set(id, { id, holderType: "USER", userId: "student-1", createdById: "student-1", startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000) });

    for (let index: number = 0; index < chunks; index += 1) {
      repository.chunks.push({ id: `${id}-${index}`, reservationId: id, startTs: startsAt, endTs: startsAt, sampleCount: 1, sampleRateHz: 20, encoding: "json", data: Buffer.from("[]"), createdAt: startsAt });
    }
  }

  return { useCase: new ListTelemetryRecordingsUseCase(repository, groups as unknown as GroupsFacade), repository, groups };
}

function command(actor: { id: string; role: string }, overrides: { userId?: string; from?: Date; to?: Date } = {}): ListTelemetryRecordingsCommand {
  return new ListTelemetryRecordingsCommand({ actor, now: NOW, ...overrides });
}

describe("ListTelemetryRecordingsUseCase", () => {
  it("lists the caller's recorded reservations of the last 90 days by default", async () => {
    const { useCase, groups }: Harness = build();

    const recordings: TelemetryRecordingSummary[] = await useCase.execute(command({ id: "student-1", role: "STUDENT" }));

    expect(recordings.map((recording: TelemetryRecordingSummary) => [recording.reservationId, recording.chunkCount])).toEqual([["recent", 2]]);
    expect(groups.assertCanViewStudent).not.toHaveBeenCalled();
  });

  it.each([
    ["a range that ends before it starts", { from: NOW, to: new Date(NOW.getTime() - DAY_MS) }],
    ["a range longer than 366 days", { from: new Date(NOW.getTime() - 367 * DAY_MS), to: NOW }],
  ])("rejects %s", async (_label: string, range: { from: Date; to: Date }) => {
    const { useCase }: Harness = build();

    await expect(useCase.execute(command({ id: "student-1", role: "STUDENT" }, range))).rejects.toBeInstanceOf(TelemetryRecordingRangeInvalidError);
  });

  it("refuses another user's recordings to a student", async () => {
    const { useCase }: Harness = build();

    await expect(useCase.execute(command({ id: "student-2", role: "STUDENT" }, { userId: "student-1" }))).rejects.toBeInstanceOf(TelemetryRecordingForbiddenError);
  });

  it("applies the teacher scope to another user's recordings", async () => {
    const { useCase, groups }: Harness = build();

    const allowed: TelemetryRecordingSummary[] = await useCase.execute(command({ id: "teacher-1", role: "TEACHER" }, { userId: "student-1", from: new Date(NOW.getTime() - 200 * DAY_MS) }));

    expect(allowed.map((recording: TelemetryRecordingSummary) => recording.reservationId).sort()).toEqual(["old", "recent"]);
    expect(groups.assertCanViewStudent).toHaveBeenCalledWith({ id: "teacher-1", role: "TEACHER" }, "student-1");
    await expect(useCase.execute(command({ id: "teacher-2", role: "TEACHER" }, { userId: "student-1" }))).rejects.toBeInstanceOf(StudentOutOfScopeError);
  });
});

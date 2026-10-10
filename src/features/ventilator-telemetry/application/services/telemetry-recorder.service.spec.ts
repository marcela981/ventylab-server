/*
 * Funcionalidad: Pruebas de la grabación de telemetría
 * Descripción: Verifica el submuestreo a VENTILATOR_RECORDING_HZ, que la escritura del fragmento cada VENTILATOR_RECORDING_FLUSH_SECONDS no se espere en el camino caliente, la detención automática cuando cambia la reserva activa y la lectura de la grabación ordenada con autorización por titularidad o rol
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { GetTelemetryRecordingCommand } from "@/features/ventilator-telemetry/application/commands/telemetry-recording.command";
import { type TelemetryRecordingResult } from "@/features/ventilator-telemetry/application/results/telemetry-recording.result";
import { TelemetryRecorderService } from "@/features/ventilator-telemetry/application/services/telemetry-recorder.service";
import { TelemetryRecordingAccessService } from "@/features/ventilator-telemetry/application/services/telemetry-recording-access.service";
import {
  buildTelemetrySettings,
  FakeTelemetryClock,
  InMemoryTelemetryChunksRepository,
  JsonTelemetryChunkCodec,
} from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";
import { GetTelemetryRecordingUseCase } from "@/features/ventilator-telemetry/application/use-cases/get-telemetry-recording.usecase";
import { type RecordedTelemetrySample } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-chunk";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";
import { TelemetryRecordingForbiddenError } from "@/features/ventilator-telemetry/domain/ventilator-telemetry.errors";

function frame(serverTs: number, seq: number): TelemetryFrame {
  return { serverTs, seq, pressure: 10, flow: 20, volume: 300, deviceId: "ventilab-device-001" };
}

async function flushMicrotasks(): Promise<void> {
  for (let index: number = 0; index < 5; index++) {
    await Promise.resolve();
  }
}

describe("TelemetryRecorderService", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("subsamples 60 Hz frames to the configured recording rate", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const repository: InMemoryTelemetryChunksRepository = new InMemoryTelemetryChunksRepository();
    const recorder: TelemetryRecorderService = new TelemetryRecorderService(buildTelemetrySettings({ recordingHz: 20 }), repository, new JsonTelemetryChunkCodec(), clock);
    const offered: number[] = [];

    recorder.start("reservation-1");

    for (let index: number = 0; index < 60; index++) {
      recorder.offer(frame(clock.nowMs + Math.round(index * (1000 / 60)), index));
      offered.push(index);
    }

    recorder.stop();

    return flushMicrotasks().then((): void => {
      expect(repository.chunks).toHaveLength(1);
      expect(repository.chunks[0].sampleCount).toBe(20);
      expect(repository.chunks[0].sampleRateHz).toBe(20);
      expect(offered).toHaveLength(60);
    });
  });

  it("writes one chunk per flush period without awaiting the repository on the hot path", async () => {
    jest.useFakeTimers();
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const repository: InMemoryTelemetryChunksRepository = new InMemoryTelemetryChunksRepository();
    const recorder: TelemetryRecorderService = new TelemetryRecorderService(buildTelemetrySettings({ recordingFlushSeconds: 5 }), repository, new JsonTelemetryChunkCodec(), clock);
    let releaseSave: () => void = (): void => undefined;

    repository.pendingSave = new Promise<void>((resolve: () => void): void => {
      releaseSave = resolve;
    });
    recorder.start("reservation-1");
    recorder.offer(frame(clock.nowMs, 1));
    jest.advanceTimersByTime(5000);
    recorder.offer(frame(clock.nowMs + 100, 2));
    const savedWhileBlocked: number = repository.chunks.length;

    releaseSave();
    await flushMicrotasks();
    recorder.stop();
    await flushMicrotasks();

    expect(savedWhileBlocked).toBe(0);
    expect(repository.chunks.map((chunk: { sampleCount: number }): number => chunk.sampleCount)).toEqual([1, 1]);
  });

  it("stops automatically when the active reservation changes", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const recorder: TelemetryRecorderService = new TelemetryRecorderService(buildTelemetrySettings(), new InMemoryTelemetryChunksRepository(), new JsonTelemetryChunkCodec(), clock);

    recorder.start("reservation-1");
    recorder.stopUnlessReservation("reservation-1");
    const stillActive: boolean = recorder.status.active;

    recorder.stopUnlessReservation(undefined);

    expect(stillActive).toBe(true);
    expect(recorder.status.active).toBe(false);
  });
});

describe("GetTelemetryRecordingUseCase", () => {
  function build(isHolder: boolean): { useCase: GetTelemetryRecordingUseCase; repository: InMemoryTelemetryChunksRepository; recorder: TelemetryRecorderService } {
    const repository: InMemoryTelemetryChunksRepository = new InMemoryTelemetryChunksRepository();
    const facade: ReservationsFacade = { isHolder: async (): Promise<boolean> => await Promise.resolve(isHolder) } as unknown as ReservationsFacade;
    const codec: JsonTelemetryChunkCodec = new JsonTelemetryChunkCodec();
    const recorder: TelemetryRecorderService = new TelemetryRecorderService(buildTelemetrySettings({ recordingHz: 1000 }), repository, codec, new FakeTelemetryClock());

    repository.holders.set("reservation-1", {
      id: "reservation-1",
      holderType: "USER",
      userId: "student-1",
      createdById: "student-1",
      startsAt: new Date(),
      endsAt: new Date(),
    });

    return { useCase: new GetTelemetryRecordingUseCase(new TelemetryRecordingAccessService(facade, repository), repository, codec), repository, recorder };
  }

  it("returns the decoded frames ordered by time to a holder", async () => {
    const { useCase, recorder }: { useCase: GetTelemetryRecordingUseCase; recorder: TelemetryRecorderService } = build(true);

    recorder.start("reservation-1");
    recorder.offer(frame(2000, 2));
    recorder.flushChunk();
    recorder.offer(frame(3000, 3));
    recorder.stop();
    await flushMicrotasks();

    const result: TelemetryRecordingResult = await useCase.execute(new GetTelemetryRecordingCommand({ reservationId: "reservation-1", userId: "student-1", role: "STUDENT" }));

    expect(result.chunkCount).toBe(2);
    expect(result.frames.map((sample: RecordedTelemetrySample): number => sample.serverTs)).toEqual([2000, 3000]);
  });

  it("rejects a student who is not a holder and allows a teacher", async () => {
    const { useCase }: { useCase: GetTelemetryRecordingUseCase } = build(false);

    const forStudent: Promise<TelemetryRecordingResult> = useCase.execute(new GetTelemetryRecordingCommand({ reservationId: "reservation-1", userId: "student-2", role: "STUDENT" }));
    const forTeacher: TelemetryRecordingResult = await useCase.execute(new GetTelemetryRecordingCommand({ reservationId: "reservation-1", userId: "teacher-1", role: "TEACHER" }));

    await expect(forStudent).rejects.toBeInstanceOf(TelemetryRecordingForbiddenError);
    expect(forTeacher.frames).toEqual([]);
  });
});

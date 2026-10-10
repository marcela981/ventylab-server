/*
 * Funcionalidad: Pruebas de las lecturas de sesiones de simulación
 * Descripción: Verifica el estado repetido en el servidor (ajustes vigentes y tiempo simulado), el paso diferido a ABANDONED por inactividad, el acceso del dueño, de docentes que gestionan el grupo del dueño y de administradores, el rechazo a otros actores, la repetición con aviso de versión del motor distinta y el listado con acceso al historial de otro estudiante
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import { AppendSimulationEventsCommand } from "@/features/simulation/application/commands/append-simulation-events.command";
import {
  type SimulationSessionReplayResult,
  type SimulationSessionStateResult,
} from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationActor } from "@/features/simulation/application/services/simulation-session-access.service";
import {
  createSimulationTestContext,
  type SimulationTestContext,
  storeSession,
  TEST_SETTINGS,
  useFixedClock,
} from "@/features/simulation/application/testing/simulation-sessions-test-doubles-spec";
import { AppendSimulationEventsUseCase } from "@/features/simulation/application/use-cases/append-simulation-events.usecase";
import { GetSimulationSessionReplayUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-replay.usecase";
import { GetSimulationSessionStateUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-state.usecase";
import { GetSimulationSessionsUseCase } from "@/features/simulation/application/use-cases/get-simulation-sessions.usecase";
import { ENGINE_VERSION } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { SimulationSessionAccessDeniedError, SimulationSessionNotFoundError } from "@/features/simulation/domain/simulation.errors";

const STARTED_AT: Date = new Date("2026-10-08T12:00:00Z");
const OWNER: SimulationActor = { id: "student-1", role: "STUDENT" };
const TEACHER: SimulationActor = { id: "teacher-1", role: "TEACHER" };

describe("Simulation session reads", () => {
  let context: SimulationTestContext;
  let getState: GetSimulationSessionStateUseCase;
  let session: SimulationSession;

  beforeEach(async () => {
    useFixedClock(STARTED_AT);
    context = createSimulationTestContext();
    getState = new GetSimulationSessionStateUseCase(context.reader, context.runtime);
    session = await storeSession(context);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("replays the session up to the last accepted event and returns the current settings", async () => {
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 30_000));
    await new AppendSimulationEventsUseCase(context.repository, context.transactionManager, TEST_SETTINGS, context.runtime).execute(
      new AppendSimulationEventsCommand({
        sessionId: session.id,
        userId: OWNER.id,
        events: [{ id: "event-1", simTimeMs: 20_000, type: "PARAM_CHANGE", payload: { changes: { peepCmH2O: 8 } } }],
      }),
    );

    const state: SimulationSessionStateResult = await getState.execute(session.id, OWNER);

    expect(state.simTimeMs).toBe(20_000);
    expect(state.settings.peepCmH2O).toBe(8);
    expect(state.settings.tidalVolumeMl).toBe(500);
    expect(state.metrics.simTimeMs).toBe(20_000);
    expect(state.targets.length).toBeGreaterThan(0);
    expect(state.session.status).toBe("ACTIVE");
  });

  it("marks an idle active session as abandoned when it is loaded", async () => {
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 31 * 60_000));

    const state: SimulationSessionStateResult = await getState.execute(session.id, OWNER);

    expect(state.session.status).toBe("ABANDONED");
    expect(context.repository.sessions.get(session.id)?.status).toBe("ABANDONED");
    expect(context.repository.lockedIds).toEqual([session.id]);
  });

  it("keeps a recently active session active without locking it", async () => {
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 29 * 60_000));

    const state: SimulationSessionStateResult = await getState.execute(session.id, OWNER);

    expect(state.session.status).toBe("ACTIVE");
    expect(context.repository.lockedIds).toEqual([]);
  });

  it("lets a teacher who manages the owner's group read the session", async () => {
    context.groups.studentGroups.set(OWNER.id, "group-1");
    context.groups.managers.add(`${TEACHER.id}:group-1`);

    const state: SimulationSessionStateResult = await getState.execute(session.id, TEACHER);

    expect(state.session.id).toBe(session.id);
  });

  it("lets an admin read any session", async () => {
    const state: SimulationSessionStateResult = await getState.execute(session.id, { id: "admin-1", role: "ADMIN" });

    expect(state.session.id).toBe(session.id);
  });

  it.each([
    ["a teacher outside the owner's group", TEACHER],
    ["another student", { id: "student-2", role: "STUDENT" }],
  ])("rejects %s with 403", async (_label: string, actor: { id: string; role: string }) => {
    context.groups.studentGroups.set(OWNER.id, "group-1");

    await expect(getState.execute(session.id, actor)).rejects.toBeInstanceOf(SimulationSessionAccessDeniedError);
  });

  it("returns 404 for an unknown session", async () => {
    await expect(getState.execute("missing", OWNER)).rejects.toBeInstanceOf(SimulationSessionNotFoundError);
  });

  it("returns the replay data and flags an engine version mismatch", async () => {
    session = await storeSession(context, { engineVersion: "0.9.0" });
    const getReplay: GetSimulationSessionReplayUseCase = new GetSimulationSessionReplayUseCase(context.reader, context.runtime);

    const replay: SimulationSessionReplayResult = await getReplay.execute(session.id, OWNER);

    expect(replay.engineCase.id).toBe("case-normal");
    expect(replay.currentEngineVersion).toBe(ENGINE_VERSION);
    expect(replay.engineVersionMismatch).toBe(true);
  });

  it("lists a student's sessions for a managing teacher and rejects other actors", async () => {
    const listSessions: GetSimulationSessionsUseCase = new GetSimulationSessionsUseCase(context.repository, context.accessService, context.runtime);
    context.groups.studentGroups.set(OWNER.id, "group-1");
    context.groups.managers.add(`${TEACHER.id}:group-1`);

    const page: Paginated<SimulationSession> = await listSessions.execute(TEACHER, { page: 1, limit: 10, userId: OWNER.id });

    expect(page.data.map((item: SimulationSession): string => item.id)).toEqual([session.id]);
    await expect(listSessions.execute({ id: "student-2", role: "STUDENT" }, { page: 1, limit: 10, userId: OWNER.id })).rejects.toBeInstanceOf(
      SimulationSessionAccessDeniedError,
    );
  });

  it("settles stale active sessions before listing them so no stale ACTIVE row is returned", async () => {
    const listSessions: GetSimulationSessionsUseCase = new GetSimulationSessionsUseCase(context.repository, context.accessService, context.runtime);
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 20 * 60_000));
    const recent: SimulationSession = await storeSession(context);
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 31 * 60_000));

    const page: Paginated<SimulationSession> = await listSessions.execute(OWNER, { page: 1, limit: 10, userId: OWNER.id });
    const activeOnly: Paginated<SimulationSession> = await listSessions.execute(OWNER, { page: 1, limit: 10, userId: OWNER.id, status: "ACTIVE" });

    expect(page.data.find((item: SimulationSession): boolean => item.id === session.id)?.status).toBe("ABANDONED");
    expect(page.data.find((item: SimulationSession): boolean => item.id === recent.id)?.status).toBe("ACTIVE");
    expect(activeOnly.data.map((item: SimulationSession): string => item.id)).toEqual([recent.id]);
    expect(context.repository.lockedIds).toEqual([session.id]);
  });
});

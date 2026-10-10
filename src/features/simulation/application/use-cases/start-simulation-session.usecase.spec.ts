/*
 * Funcionalidad: Pruebas de StartSimulationSessionUseCase
 * Descripción: Verifica el inicio de sesiones libres (caso publicado, semilla del servidor, versión del motor, evento START) y de examen (intento propio en curso y vigente, pregunta SIMULATION de la misma evaluación, caso tomado de la pregunta, vencimiento en la fecha límite y rúbrica válida), con 403 cuando el intento o la pregunta no lo permiten
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ClinicalCaseUnavailableError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { StartSimulationSessionCommand } from "@/features/simulation/application/commands/start-simulation-session.command";
import { type StartSimulationSessionResult } from "@/features/simulation/application/results/simulation-session.results";
import {
  createSimulationTestContext,
  FixedSeedGenerator,
  normalLungSnapshot,
  type SimulationTestContext,
  TEST_SEED,
  useFixedClock,
} from "@/features/simulation/application/testing/simulation-sessions-test-doubles-spec";
import { StartSimulationSessionUseCase } from "@/features/simulation/application/use-cases/start-simulation-session.usecase";
import { ENGINE_VERSION } from "@/features/simulation/domain/engine";
import { type SimulationEventRecord } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  SimulationCaseRequiredError,
  SimulationExamAccessDeniedError,
  SimulationRubricInvalidError,
} from "@/features/simulation/domain/simulation.errors";

const NOW: Date = new Date("2026-10-08T12:00:00Z");
const STUDENT_ID: string = "student-1";

function examCommand(overrides: Partial<ConstructorParameters<typeof StartSimulationSessionCommand>[0]> = {}): StartSimulationSessionCommand {
  return new StartSimulationSessionCommand({
    userId: STUDENT_ID,
    mode: "EXAM",
    caseId: "client-chosen-case",
    attemptId: "attempt-1",
    questionId: "question-1",
    timeMultiplier: 1,
    ...overrides,
  });
}

describe("StartSimulationSessionUseCase", () => {
  let context: SimulationTestContext;
  let useCase: StartSimulationSessionUseCase;

  beforeEach(() => {
    useFixedClock(NOW);
    context = createSimulationTestContext();
    useCase = new StartSimulationSessionUseCase(
      context.repository,
      context.examReader,
      new FixedSeedGenerator(),
      context.transactionManager,
      context.clinicalCases.asFacade(),
      context.runtime,
    );
    context.clinicalCases.cases.set("case-exam", normalLungSnapshot({ id: "case-exam", status: "DRAFT" }));
    context.examReader.attempts.set("attempt-1", {
      id: "attempt-1",
      userId: STUDENT_ID,
      evaluationId: "evaluation-1",
      status: "IN_PROGRESS",
      deadlineAt: new Date("2026-10-08T13:00:00Z"),
    });
    context.examReader.questions.set("question-1", { id: "question-1", evaluationId: "evaluation-1", type: "SIMULATION", clinicalCaseId: "case-exam" });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts a free session with a server seed, the current engine version and a START event", async () => {
    const result: StartSimulationSessionResult = await useCase.execute(
      new StartSimulationSessionCommand({ userId: STUDENT_ID, mode: "FREE", caseId: "case-normal", timeMultiplier: 2 }),
    );

    const events: SimulationEventRecord[] = context.repository.eventsOf(result.session.id);

    expect(result.session.seed).toBe(TEST_SEED);
    expect(result.session.engineVersion).toBe(ENGINE_VERSION);
    expect(result.session.timeMultiplier).toBe(2);
    expect(result.session.status).toBe("ACTIVE");
    expect(result.expiresAt).toBeUndefined();
    expect(result.engineCase.id).toBe("case-normal");
    expect(context.repository.sessions.get(result.session.id)).toBe(result.session);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("START");
    expect(events[0].simTimeMs).toBe(0);
  });

  it("rejects a free session without caseId", async () => {
    const command: StartSimulationSessionCommand = new StartSimulationSessionCommand({ userId: STUDENT_ID, mode: "FREE", timeMultiplier: 1 });

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(SimulationCaseRequiredError);
  });

  it("rejects a free session on an unpublished case", async () => {
    const command: StartSimulationSessionCommand = new StartSimulationSessionCommand({ userId: STUDENT_ID, mode: "FREE", caseId: "case-exam", timeMultiplier: 1 });

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(ClinicalCaseUnavailableError);
  });

  it("starts an exam session on the question case, ignoring the client case, and expires at the attempt deadline", async () => {
    const result: StartSimulationSessionResult = await useCase.execute(examCommand());

    expect(result.session.mode).toBe("EXAM");
    expect(result.session.caseId).toBe("case-exam");
    expect(result.session.attemptId).toBe("attempt-1");
    expect(result.session.questionId).toBe("question-1");
    expect(result.expiresAt).toEqual(new Date("2026-10-08T13:00:00Z"));
  });

  it.each([
    ["the attempt belongs to another user", (ctx: SimulationTestContext): void => {
      ctx.examReader.attempts.set("attempt-1", { id: "attempt-1", userId: "other", evaluationId: "evaluation-1", status: "IN_PROGRESS" });
    }],
    ["the attempt is not in progress", (ctx: SimulationTestContext): void => {
      ctx.examReader.attempts.set("attempt-1", { id: "attempt-1", userId: STUDENT_ID, evaluationId: "evaluation-1", status: "SUBMITTED" });
    }],
    ["the attempt deadline has passed", (ctx: SimulationTestContext): void => {
      ctx.examReader.attempts.set("attempt-1", {
        id: "attempt-1",
        userId: STUDENT_ID,
        evaluationId: "evaluation-1",
        status: "IN_PROGRESS",
        deadlineAt: new Date("2026-10-08T11:59:00Z"),
      });
    }],
    ["the attempt does not exist", (ctx: SimulationTestContext): void => {
      ctx.examReader.attempts.clear();
    }],
    ["the question is not a simulation question", (ctx: SimulationTestContext): void => {
      ctx.examReader.questions.set("question-1", { id: "question-1", evaluationId: "evaluation-1", type: "OPEN_TEXT", clinicalCaseId: "case-exam" });
    }],
    ["the question belongs to another evaluation", (ctx: SimulationTestContext): void => {
      ctx.examReader.questions.set("question-1", { id: "question-1", evaluationId: "evaluation-2", type: "SIMULATION", clinicalCaseId: "case-exam" });
    }],
  ])("rejects an exam session with 403 when %s", async (_label: string, arrange: (ctx: SimulationTestContext) => void) => {
    arrange(context);

    const execution: Promise<StartSimulationSessionResult> = useCase.execute(examCommand());

    await expect(execution).rejects.toBeInstanceOf(SimulationExamAccessDeniedError);
    expect(context.repository.sessions.size).toBe(0);
  });

  it("rejects an exam session without attempt or question", async () => {
    const command: StartSimulationSessionCommand = examCommand({ attemptId: undefined });

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(SimulationExamAccessDeniedError);
  });

  it("rejects an exam session whose question rubric is invalid", async () => {
    context.examReader.questions.set("question-1", {
      id: "question-1",
      evaluationId: "evaluation-1",
      type: "SIMULATION",
      clinicalCaseId: "case-exam",
      rubric: { criteria: [{ type: "UNKNOWN", weight: 1 }] },
    });

    await expect(useCase.execute(examCommand())).rejects.toBeInstanceOf(SimulationRubricInvalidError);
  });
});

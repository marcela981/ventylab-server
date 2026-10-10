/*
 * Funcionalidad: Pruebas de SimulationReplayPracticalScoreProvider
 * Descripción: Verifica que una pregunta SIMULATION se califica con la repetición de la sesión en el servidor vía SimulationFacade (con desglose), que se rechazan sesiones de otro estudiante, intento o pregunta sin calcular nada y que un puntaje del cliente nunca reemplaza el recalculado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Paginated } from "@/common/domain/utils/paginated";
import {
  type PracticalScoreResult,
  SESSION_NOT_BOUND_REASON,
  SESSION_NOT_FOUND_REASON,
} from "@/features/evaluation/application/ports/practical-score-provider.interface";
import { type SimulationAnswerTarget } from "@/features/evaluation/application/ports/simulation-session-binding.interface";
import { SimulationReplayPracticalScoreProvider } from "@/features/evaluation/infrastructure/simulation/simulation-replay-practical-score-provider";
import { SimulationFacadeSessionBindingReader } from "@/features/evaluation/infrastructure/simulation/simulation-session-binding-reader";
import { type SimulationFacade } from "@/features/simulation/application/services/simulation.facade";

interface SessionRow {
  readonly id: string;
  readonly userId: string;
  readonly mode: string;
  readonly attemptId?: string;
  readonly questionId?: string;
  readonly score?: number;
}

const TARGET: SimulationAnswerTarget = { userId: "student-1", attemptId: "attempt-1", questionId: "q1" };
const BOUND_SESSION: SessionRow = { id: "session-1", userId: "student-1", mode: "EXAM", attemptId: "attempt-1", questionId: "q1", score: 1 };
const REPLAY_BREAKDOWN: Record<string, unknown>[] = [{ criterion: "TARGETS_REACHED", points: 0.5, justification: "1 of 2 targets met" }];

function buildProvider(sessions: SessionRow[]): { provider: SimulationReplayPracticalScoreProvider; getSessionScore: jest.Mock } {
  const getSessionScore: jest.Mock = jest.fn().mockResolvedValue({ available: true, score: 0.42, breakdown: REPLAY_BREAKDOWN });
  const getUserSessions: jest.Mock = jest.fn().mockImplementation((userId: string, query: { ids?: string[] }): Promise<Paginated<SessionRow>> => {
    const items: SessionRow[] = sessions.filter((row: SessionRow): boolean => row.userId === userId && (query.ids ?? []).includes(row.id));

    return Promise.resolve(new Paginated<SessionRow>({ items, total: items.length, page: 1, limit: 1 }));
  });
  const facade: SimulationFacade = { getSessionScore, getUserSessions } as unknown as SimulationFacade;

  return { provider: new SimulationReplayPracticalScoreProvider(facade, new SimulationFacadeSessionBindingReader(facade)), getSessionScore };
}

describe("SimulationReplayPracticalScoreProvider", () => {
  it("scores a SIMULATION question with the server replay score and its breakdown", async () => {
    const { provider, getSessionScore } = buildProvider([BOUND_SESSION]);
    const rubric: Record<string, unknown> = { criteria: [{ type: "TARGETS_REACHED", weight: 1 }] };

    const result: PracticalScoreResult = await provider.getSessionScore("session-1", rubric, TARGET);

    expect(result).toEqual({ available: true, score: 0.42, breakdown: REPLAY_BREAKDOWN });
    expect(getSessionScore).toHaveBeenCalledWith("session-1", rubric);
  });

  it("ignores a client-supplied score stored with the session and always uses the recomputed one", async () => {
    const { provider } = buildProvider([{ ...BOUND_SESSION, score: 1 }]);

    const result: PracticalScoreResult = await provider.getSessionScore("session-1", undefined, TARGET);

    expect(result).toMatchObject({ available: true, score: 0.42 });
  });

  it.each([
    ["another user", { ...BOUND_SESSION, userId: "student-2" }, SESSION_NOT_FOUND_REASON],
    ["another attempt", { ...BOUND_SESSION, attemptId: "attempt-9" }, SESSION_NOT_BOUND_REASON],
    ["another question", { ...BOUND_SESSION, questionId: "q9" }, SESSION_NOT_BOUND_REASON],
    ["free practice", { id: "session-1", userId: "student-1", mode: "FREE" }, SESSION_NOT_BOUND_REASON],
  ])("rejects a session of %s without scoring it", async (_label: string, session: SessionRow, reason: string) => {
    const { provider, getSessionScore } = buildProvider([session]);

    const result: PracticalScoreResult = await provider.getSessionScore("session-1", undefined, TARGET);

    expect(result).toEqual({ available: false, reason });
    expect(getSessionScore).not.toHaveBeenCalled();
  });

  it("reports the facade reason when the session cannot be scored", async () => {
    const { provider, getSessionScore } = buildProvider([BOUND_SESSION]);
    getSessionScore.mockResolvedValue({ available: false, reason: "CASE_UNAVAILABLE" });

    const result: PracticalScoreResult = await provider.getSessionScore("session-1", undefined, TARGET);

    expect(result).toEqual({ available: false, reason: "CASE_UNAVAILABLE" });
  });
});

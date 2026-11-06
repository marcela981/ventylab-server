/*
 * Funcionalidad: Pruebas de la respuesta coherente de la asistencia de IA
 * Descripción: Verifica que una respuesta coherente se entrega tal cual, que una respuesta que afirma estabilidad con el paciente crítico se regenera una vez con la nota correctiva y que si vuelve a fallar se entrega la sugerencia determinista con el aviso INCONSISTENT_STATE; también que una regeneración que falla cae a esa sugerencia y que un aborto no entrega nada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import {
  assistCoherenceValidator,
  type CoherentAssistAnswer,
  coherentAssistAnswer,
  type CoherentAssistRequest,
  contextHashOf,
  INCONSISTENT_STATE_NOTICE,
} from "@/features/simulation/application/assist/coherent-assist-answer";
import { type AssistCoherenceState } from "@/features/simulation/domain/assist/assist-coherence";
import { buildAssistInput } from "@/features/simulation/domain/assist/assist-test-input-spec";

const CRITICAL: AssistCoherenceState = {
  metrics: {
    ...buildAssistInput().metrics,
    alarms: [{ code: "LOW_SPO2", severity: "HIGH", value: 72, threshold: 90 }],
    patient: { status: "CRITICAL", severity: 0.69, heartRateBpm: 107, insults: [], criticalExposureMin: 0, firstCriticalAtMs: 1, arrestAtMs: null, deceasedAtMs: null },
  },
};

// Mirrors the orchestrator: the validator option of the call decides rejectionReason.
async function* answerOf(content: string, aiCallId: string): AsyncGenerator<AiStreamChunk> {
  yield await Promise.resolve({ type: "delta", text: content } as AiStreamChunk);

  const rejectionReason: string | undefined = assistCoherenceValidator(CRITICAL)(content);

  yield { type: "done", result: { content, source: "LLM", aiCallId, ...(rejectionReason === undefined ? {} : { rejectionReason }) } };
}

function request(first: AsyncIterable<AiStreamChunk>, regenerate: jest.Mock): CoherentAssistRequest {
  return { first, regenerate, state: CRITICAL, deterministic: (): string => "Sugerencia determinista", language: "es" };
}

describe("coherentAssistAnswer", () => {
  it("delivers a coherent answer as it came", async () => {
    const regenerate: jest.Mock = jest.fn();

    await expect(coherentAssistAnswer(request(answerOf("Prioriza la oxigenación: sube la PEEP.", "call-1"), regenerate))).resolves.toEqual({
      text: "Prioriza la oxigenación: sube la PEEP.",
      source: "LLM",
      aiCallId: "call-1",
    });
    expect(regenerate).not.toHaveBeenCalled();
  });

  it("regenerates once with a corrective note after an answer that claims stability with a critical patient", async () => {
    const regenerate: jest.Mock = jest.fn().mockResolvedValue(answerOf("Paciente crítico: sube la PEEP.", "call-2"));

    const answer: CoherentAssistAnswer | null = await coherentAssistAnswer(request(answerOf("El paciente está estable.", "call-1"), regenerate));

    expect(answer).toEqual({ text: "Paciente crítico: sube la PEEP.", source: "LLM", aiCallId: "call-2" });
    expect(regenerate).toHaveBeenCalledTimes(1);
    expect(regenerate.mock.calls[0][0]).toContain("está estable");
  });

  it("falls back to the deterministic suggestion with the notice when the regeneration is still incoherent", async () => {
    const regenerate: jest.Mock = jest.fn().mockResolvedValue(answerOf("El paciente permanece estable.", "call-2"));

    await expect(coherentAssistAnswer(request(answerOf("El paciente está estable.", "call-1"), regenerate))).resolves.toEqual({
      text: "Sugerencia determinista",
      source: "DETERMINISTIC",
      aiCallId: "call-2",
      notice: INCONSISTENT_STATE_NOTICE,
    });
  });

  it("falls back with the notice when the regeneration cannot be asked", async () => {
    const regenerate: jest.Mock = jest.fn().mockRejectedValue(new Error("quota"));

    await expect(coherentAssistAnswer(request(answerOf("El paciente está estable.", "call-1"), regenerate))).resolves.toMatchObject({
      source: "DETERMINISTIC",
      notice: INCONSISTENT_STATE_NOTICE,
      aiCallId: "call-1",
    });
  });

  it("answers nothing when the stream ended without a result (aborted)", async () => {
    async function* aborted(): AsyncGenerator<AiStreamChunk> {
      yield await Promise.resolve({ type: "delta", text: "Parcial" } as AiStreamChunk);
    }

    await expect(coherentAssistAnswer(request(aborted(), jest.fn()))).resolves.toBeNull();
  });

  it("hashes the state text with sha256", () => {
    expect(contextHashOf("{}")).toBe("44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a");
  });
});

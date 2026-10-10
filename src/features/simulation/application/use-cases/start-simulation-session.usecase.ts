/*
 * Funcionalidad: Caso de uso StartSimulationSessionUseCase
 * Descripción: Inicia una sesión de simulación con eventos. Modo libre: caso publicado y listo para simular según ClinicalCasesFacade, sin depender de reservas. Modo examen: intento propio en curso y vigente y pregunta de tipo SIMULATION de la misma evaluación; el caso sale de la pregunta (se ignora el del cliente) y la rúbrica de la pregunta, del caso o la de por defecto debe ser válida. El servidor genera la semilla, fija ENGINE_VERSION, valida el caso en el motor y registra el evento START
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { generateId } from "@/common/domain/utils/generate-id";
import { ClinicalCasesFacade } from "@/features/clinical-cases/application/services/clinical-cases.facade";
import { type StartSimulationSessionCommand } from "@/features/simulation/application/commands/start-simulation-session.command";
import {
  EXAM_ATTEMPT_READER_TOKEN,
  type ExamAttemptInfo,
  type ExamQuestionInfo,
  type IExamAttemptReader,
  IN_PROGRESS_EXAM_ATTEMPT_STATUS,
  SIMULATION_QUESTION_TYPE,
} from "@/features/simulation/application/ports/exam-attempt-reader.interface";
import {
  type ISimulationSeedGenerator,
  SIMULATION_SEED_GENERATOR_TOKEN,
} from "@/features/simulation/application/ports/simulation-seed-generator.interface";
import { type StartSimulationSessionResult } from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationCaseDefinition } from "@/features/simulation/application/services/simulation-case.mapper";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import { createSimulation, ENGINE_VERSION, EngineValidationError } from "@/features/simulation/domain/engine";
import { SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type ISimulationSessionsRepository,
  SIMULATION_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulation-sessions.repository";
import { resolveSessionRubric } from "@/features/simulation/domain/sessions/simulation-session-rubric";
import {
  SimulationCaseNotReadyError,
  SimulationCaseRequiredError,
  SimulationExamAccessDeniedError,
} from "@/features/simulation/domain/simulation.errors";
import { EXAM_SIMULATION_MODE, START_EVENT_TYPE } from "@/features/simulation/domain/value-objects/simulation-session-values";

interface ResolvedSessionCase {
  readonly caseDefinition: SimulationCaseDefinition;
  readonly expiresAt?: Date;
}

/**
 * @throws {SimulationCaseRequiredError} If a free session has no caseId
 * @throws {ClinicalCaseNotFoundError} If the free session case does not exist
 * @throws {ClinicalCaseUnavailableError} If the free session case is not published
 * @throws {ClinicalCaseNotSimulationReadyError} If the free session case lacks its simulation profile
 * @throws {SimulationExamAccessDeniedError} If the exam attempt or question is missing, not the caller's, not in progress, past its deadline or not a simulation question of that evaluation
 * @throws {SimulationCaseNotFoundError} If the exam question case does not exist
 * @throws {SimulationCaseNotReadyError} If the case cannot be simulated by the engine
 * @throws {SimulationRubricInvalidError} If the resolved rubric is invalid
 */
@Injectable()
export class StartSimulationSessionUseCase {
  public constructor(
    @Inject(SIMULATION_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulationSessionsRepository,
    @Inject(EXAM_ATTEMPT_READER_TOKEN)
    private readonly _examAttemptReader: IExamAttemptReader,
    @Inject(SIMULATION_SEED_GENERATOR_TOKEN)
    private readonly _seedGenerator: ISimulationSeedGenerator,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    private readonly _clinicalCasesFacade: ClinicalCasesFacade,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async execute(command: StartSimulationSessionCommand): Promise<StartSimulationSessionResult> {
    const now: Date = new Date();
    const resolved: ResolvedSessionCase =
      command.mode === EXAM_SIMULATION_MODE ? await this._resolveExamCase(command, now) : await this._resolveFreeCase(command);
    const seed: number = this._seedGenerator.next();

    try {
      createSimulation(resolved.caseDefinition.engineCase, seed, { timeMultiplier: command.timeMultiplier });
    } catch (error: unknown) {
      if (error instanceof EngineValidationError) {
        throw new SimulationCaseNotReadyError();
      }

      throw error;
    }

    const session: SimulationSession = SimulationSession.start({
      userId: command.userId,
      caseId: resolved.caseDefinition.id,
      mode: command.mode,
      attemptId: command.mode === EXAM_SIMULATION_MODE ? command.attemptId : undefined,
      questionId: command.mode === EXAM_SIMULATION_MODE ? command.questionId : undefined,
      seed,
      engineVersion: ENGINE_VERSION,
      timeMultiplier: command.timeMultiplier,
      now,
    });

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._sessionsRepository.save(session, transaction);

      await this._sessionsRepository.insertEvents(
        [
          {
            id: generateId(),
            sessionId: session.id,
            simTimeMs: 0,
            type: START_EVENT_TYPE,
            payload: { caseId: session.caseId, mode: session.mode, timeMultiplier: session.timeMultiplier, engineVersion: ENGINE_VERSION },
            receivedAt: now,
          },
        ],
        transaction,
      );
    });

    return { session, expiresAt: resolved.expiresAt, engineCase: resolved.caseDefinition.engineCase };
  }

  private async _resolveFreeCase(command: StartSimulationSessionCommand): Promise<ResolvedSessionCase> {
    if (command.caseId === undefined) {
      throw new SimulationCaseRequiredError();
    }

    await this._clinicalCasesFacade.getPublishedCaseForSimulation(command.caseId);

    const caseDefinition: SimulationCaseDefinition = await this._runtime.loadCase(command.caseId);

    resolveSessionRubric([caseDefinition.defaultRubric]);

    return { caseDefinition };
  }

  private async _resolveExamCase(command: StartSimulationSessionCommand, now: Date): Promise<ResolvedSessionCase> {
    if (command.attemptId === undefined || command.questionId === undefined) {
      throw new SimulationExamAccessDeniedError();
    }

    const attempt: ExamAttemptInfo | undefined = await this._examAttemptReader.getAttempt(command.attemptId);

    if (
      !attempt ||
      attempt.userId !== command.userId ||
      attempt.status !== IN_PROGRESS_EXAM_ATTEMPT_STATUS ||
      (attempt.deadlineAt !== undefined && attempt.deadlineAt.getTime() <= now.getTime())
    ) {
      throw new SimulationExamAccessDeniedError();
    }

    const question: ExamQuestionInfo | undefined = await this._examAttemptReader.getQuestion(command.questionId);

    if (
      !question ||
      question.type !== SIMULATION_QUESTION_TYPE ||
      question.evaluationId !== attempt.evaluationId ||
      question.clinicalCaseId === undefined
    ) {
      throw new SimulationExamAccessDeniedError();
    }

    const caseDefinition: SimulationCaseDefinition = await this._runtime.loadCase(question.clinicalCaseId);

    resolveSessionRubric([question.rubric, caseDefinition.defaultRubric]);

    return { caseDefinition, expiresAt: attempt.deadlineAt };
  }
}

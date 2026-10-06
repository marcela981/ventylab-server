/*
 * Funcionalidad: Caso de uso EvaluateClinicalCaseUseCase
 * Descripción: Compara la configuración del estudiante con la configuración experta del caso, genera la retroalimentación (IA con respaldo determinístico) fuera de la transacción, registra el EvaluationAttempt con su tiempo de resolución y calcula la mejora frente al intento anterior
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { EvaluateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/evaluate-clinical-case.command";
import { ClinicalCaseEvaluationResult } from "@/features/clinical-cases/application/results/clinical-case.results";
import { EvaluationFeedbackGenerator } from "@/features/clinical-cases/application/services/evaluation-feedback-generator.service";
import { ClinicalCaseNotFoundError, ExpertConfigurationMissingError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { EvaluationAttempt } from "@/features/clinical-cases/domain/entities/evaluation-attempt.entity";
import { type ClinicalCaseDetail } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  type ConfigurationComparison,
  type EvaluationFeedback,
  type ExpertConfigurationData,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import { compareConfigurations } from "@/features/clinical-cases/domain/services/configuration-comparison";

/**
 * @throws {ClinicalCaseNotFoundError} If the clinical case does not exist
 * @throws {ExpertConfigurationMissingError} If the clinical case has no expert configuration
 */
@Injectable()
export class EvaluateClinicalCaseUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    private readonly _feedbackGenerator: EvaluationFeedbackGenerator,
  ) {}

  public async execute(command: EvaluateClinicalCaseCommand): Promise<ClinicalCaseEvaluationResult> {
    const startTime: number = Date.now();
    const { userId, caseId, configuration } = command;

    const clinicalCase: ClinicalCaseDetail | undefined = await this._clinicalCasesRepository.getById(caseId);

    if (!clinicalCase) {
      throw new ClinicalCaseNotFoundError();
    }

    const expertConfiguration: ExpertConfigurationData | undefined = await this._clinicalCasesRepository.getExpertConfiguration(caseId);

    if (!expertConfiguration) {
      throw new ExpertConfigurationMissingError();
    }

    const comparison: ConfigurationComparison = compareConfigurations(configuration, expertConfiguration);
    const feedback: EvaluationFeedback = await this._feedbackGenerator.generateFeedback(clinicalCase, configuration, expertConfiguration, comparison);
    const completionTime: number = Math.floor((Date.now() - startTime) / 1000);

    const { attempt, events } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ attempt: EvaluationAttempt; events: DomainEvent[] }> => {
        const created: EvaluationAttempt = EvaluationAttempt.create({
          userId,
          clinicalCaseId: caseId,
          userConfiguration: configuration,
          comparison,
          aiFeedback: feedback.feedback,
          completionTime,
        });

        await this._clinicalCasesRepository.saveAttempt(created, transaction);

        return { attempt: created, events: created.getEvents() };
      },
    );

    this._eventBus.publish(events);

    const previousScore: number | undefined = await this._clinicalCasesRepository.getLatestOtherAttemptScore(userId, caseId, attempt.id);

    return new ClinicalCaseEvaluationResult({
      attemptId: attempt.id,
      score: comparison.score,
      isSuccessful: attempt.isSuccessful,
      completionTime,
      comparison,
      feedback,
      expertConfiguration,
      improvement:
        previousScore !== undefined
          ? {
            previousScore,
            currentScore: comparison.score,
            difference: comparison.score - previousScore,
            improved: comparison.score - previousScore > 0,
          }
          : undefined,
    });
  }
}

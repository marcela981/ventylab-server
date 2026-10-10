/*
 * Funcionalidad: Módulo EvaluationModule
 * Descripción: Registra la feature de evaluaciones: controladores /api/evaluations de autoría y de activación (/api/evaluations/:id/assignments, /api/evaluation-assignments, con GroupsModule para el alcance de grupos) y del estudiante (/api/my-evaluations, /api/evaluation-attempts), editor transaccional, cierre y calificación de intentos, configuración de calificación desde EVALUATION_PASSING_GRADE, vinculación de sesiones de simulación con eventos vía SimulationFacade (SimulationModule), casos de uso, repositorios Prisma de evaluaciones y asignaciones, manejador de eventos en tiempo real y los adaptadores de retroalimentación (gateway de IA vía AiModule con respaldo determinista), puntaje práctico recalculado por repetición de la sesión en el servidor y lector de sesiones del simulador heredadas; retroalimentación de calificación asíncrona (repositorio Prisma de GradeFeedback, generación, regeneración y lecturas, manejadores @OnEvent y controlador de /api/evaluation-attempts/:attemptId/feedback y /api/evaluation-grading/attempts/:attemptId/feedback); calificación docente (/api/evaluation-grading: cola, vista, puntaje manual con auditoría, publicación; repositorio Prisma de lectura de calificación, alcance de calificación) y EvaluationFacade exportada (notas publicadas, estadísticas y pendientes de revisión)
 * Versión: 1.6
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { AiModule } from "@/features/ai/ai.module";
import { AuthModule } from "@/features/auth/auth.module";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { GRADE_FEEDBACK_GENERATOR_TOKEN } from "@/features/evaluation/application/ports/grade-feedback-generator.interface";
import { PRACTICAL_SCORE_PROVIDER_TOKEN } from "@/features/evaluation/application/ports/practical-score-provider.interface";
import { SIMULATION_SESSION_BINDING_READER_TOKEN } from "@/features/evaluation/application/ports/simulation-session-binding.interface";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { EvaluationAttemptCloser } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { EvaluationEditor } from "@/features/evaluation/application/services/evaluation-editor";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { GradeFeedbackAccess } from "@/features/evaluation/application/services/grade-feedback-access";
import { StudentAnswerRecorder } from "@/features/evaluation/application/services/student-answer-recorder";
import { AddEvaluationOptionUseCase } from "@/features/evaluation/application/use-cases/add-evaluation-option.usecase";
import { AddEvaluationQuestionUseCase } from "@/features/evaluation/application/use-cases/add-evaluation-question.usecase";
import { AddEvaluationScenarioUseCase } from "@/features/evaluation/application/use-cases/add-evaluation-scenario.usecase";
import { ChangeEvaluationStatusUseCase } from "@/features/evaluation/application/use-cases/change-evaluation-status.usecase";
import { CloseEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/close-evaluation-assignment.usecase";
import { CreateEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/create-evaluation-assignments.usecase";
import { CreateEvaluationUseCase } from "@/features/evaluation/application/use-cases/create-evaluation.usecase";
import { DeleteEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/delete-evaluation-assignment.usecase";
import { DeleteEvaluationUseCase } from "@/features/evaluation/application/use-cases/delete-evaluation.usecase";
import { DuplicateEvaluationUseCase } from "@/features/evaluation/application/use-cases/duplicate-evaluation.usecase";
import { GetAttemptForGradingUseCase } from "@/features/evaluation/application/use-cases/get-attempt-for-grading.usecase";
import { GetEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-assignments.usecase";
import { GetEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-attempt.usecase";
import { GetEvaluationDetailUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-detail.usecase";
import { GetEvaluationsUseCase } from "@/features/evaluation/application/use-cases/get-evaluations.usecase";
import { GetGradingQueueUseCase } from "@/features/evaluation/application/use-cases/get-grading-queue.usecase";
import { GetManagedEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-managed-evaluation-assignments.usecase";
import { GetMyEvaluationsUseCase } from "@/features/evaluation/application/use-cases/get-my-evaluations.usecase";
import { GetStudentEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-student-evaluation-assignments.usecase";
import { GradeEvaluationAnswerUseCase } from "@/features/evaluation/application/use-cases/grade-evaluation-answer.usecase";
import { GenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-generation.usecase";
import { RegenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-regeneration.usecase";
import { GetMyGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-student-read.usecase";
import { GetGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-teacher-read.usecase";
import { PublishEvaluationAttemptGradeUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-attempt-grade.usecase";
import { PublishEvaluationGradesUseCase } from "@/features/evaluation/application/use-cases/publish-evaluation-grades.usecase";
import { RemoveEvaluationOptionUseCase } from "@/features/evaluation/application/use-cases/remove-evaluation-option.usecase";
import { RemoveEvaluationQuestionUseCase } from "@/features/evaluation/application/use-cases/remove-evaluation-question.usecase";
import { RemoveEvaluationScenarioUseCase } from "@/features/evaluation/application/use-cases/remove-evaluation-scenario.usecase";
import { ReorderEvaluationOptionsUseCase } from "@/features/evaluation/application/use-cases/reorder-evaluation-options.usecase";
import { ReorderEvaluationQuestionsUseCase } from "@/features/evaluation/application/use-cases/reorder-evaluation-questions.usecase";
import { ReorderEvaluationScenariosUseCase } from "@/features/evaluation/application/use-cases/reorder-evaluation-scenarios.usecase";
import { SaveEvaluationAnswerUseCase } from "@/features/evaluation/application/use-cases/save-evaluation-answer.usecase";
import { StartEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/start-evaluation-attempt.usecase";
import { SubmitEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/submit-evaluation-attempt.usecase";
import { UpdateEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-assignment.usecase";
import { UpdateEvaluationOptionUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-option.usecase";
import { UpdateEvaluationQuestionUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-question.usecase";
import { UpdateEvaluationScenarioUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-scenario.usecase";
import { UpdateEvaluationUseCase } from "@/features/evaluation/application/use-cases/update-evaluation.usecase";
import { EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATION_GRADING_REPOSITORY_TOKEN } from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { EVALUATIONS_REPOSITORY_TOKEN } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { GRADE_FEEDBACKS_REPOSITORY_TOKEN } from "@/features/evaluation/domain/repositories/grade-feedbacks.repository";
import { STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN } from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";
import { AIGradeFeedbackGenerator } from "@/features/evaluation/infrastructure/ai/ai-grade-feedback-generator";
import { EvaluationEventsHandlers } from "@/features/evaluation/infrastructure/events/evaluation-events.handlers";
import { GradeFeedbackEventsHandlers } from "@/features/evaluation/infrastructure/events/grade-feedback-events.handlers";
import { EvaluationAssignmentsPrismaRepository } from "@/features/evaluation/infrastructure/persistence/prisma/repositories/evaluation-assignments-prisma.repository";
import { EvaluationGradingPrismaRepository } from "@/features/evaluation/infrastructure/persistence/prisma/repositories/evaluation-grading-prisma.repository";
import { EvaluationsPrismaRepository } from "@/features/evaluation/infrastructure/persistence/prisma/repositories/evaluations-prisma.repository";
import { GradeFeedbacksPrismaRepository } from "@/features/evaluation/infrastructure/persistence/prisma/repositories/grade-feedbacks-prisma.repository";
import { StudentEvaluationAttemptsPrismaRepository } from "@/features/evaluation/infrastructure/persistence/prisma/repositories/student-evaluation-attempts-prisma.repository";
import {
  PrismaSimulatorSessionReader,
  SIMULATOR_SESSION_READER_TOKEN,
} from "@/features/evaluation/infrastructure/persistence/prisma/simulator-session-reader";
import { SimulationReplayPracticalScoreProvider } from "@/features/evaluation/infrastructure/simulation/simulation-replay-practical-score-provider";
import { SimulationFacadeSessionBindingReader } from "@/features/evaluation/infrastructure/simulation/simulation-session-binding-reader";
import { EvaluationAssignmentsController } from "@/features/evaluation/presentation/controllers/evaluation-assignments.controller";
import { EvaluationGradingController } from "@/features/evaluation/presentation/controllers/evaluation-grading.controller";
import { EvaluationsController } from "@/features/evaluation/presentation/controllers/evaluations.controller";
import { GradeFeedbackController } from "@/features/evaluation/presentation/controllers/grade-feedback.controller";
import { StudentEvaluationsController } from "@/features/evaluation/presentation/controllers/student-evaluations.controller";
import { GroupsModule } from "@/features/groups/groups.module";
import { SimulationModule } from "@/features/simulation/simulation.module";

@Module({
  imports: [AuthModule, GroupsModule, AiModule, SimulationModule],
  controllers: [EvaluationsController, EvaluationAssignmentsController, StudentEvaluationsController, GradeFeedbackController, EvaluationGradingController],
  providers: [
    {
      provide: EVALUATIONS_REPOSITORY_TOKEN,
      useClass: EvaluationsPrismaRepository,
    },
    {
      provide: EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
      useClass: EvaluationAssignmentsPrismaRepository,
    },
    {
      provide: GRADE_FEEDBACK_GENERATOR_TOKEN,
      useClass: AIGradeFeedbackGenerator,
    },
    {
      provide: PRACTICAL_SCORE_PROVIDER_TOKEN,
      useClass: SimulationReplayPracticalScoreProvider,
    },
    {
      provide: SIMULATOR_SESSION_READER_TOKEN,
      useClass: PrismaSimulatorSessionReader,
    },
    {
      provide: SIMULATION_SESSION_BINDING_READER_TOKEN,
      useClass: SimulationFacadeSessionBindingReader,
    },
    {
      provide: STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
      useClass: StudentEvaluationAttemptsPrismaRepository,
    },
    {
      provide: GRADE_FEEDBACKS_REPOSITORY_TOKEN,
      useClass: GradeFeedbacksPrismaRepository,
    },
    {
      provide: EVALUATION_GRADING_REPOSITORY_TOKEN,
      useClass: EvaluationGradingPrismaRepository,
    },
    {
      provide: EVALUATION_GRADING_CONFIG_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>): EvaluationGradingConfig => ({
        passingGrade: configService.get("EVALUATION_PASSING_GRADE", { infer: true }),
      }),
    },
    EvaluationEditor,
    GetEvaluationsUseCase,
    GetEvaluationDetailUseCase,
    CreateEvaluationUseCase,
    UpdateEvaluationUseCase,
    DeleteEvaluationUseCase,
    ChangeEvaluationStatusUseCase,
    DuplicateEvaluationUseCase,
    AddEvaluationScenarioUseCase,
    UpdateEvaluationScenarioUseCase,
    RemoveEvaluationScenarioUseCase,
    ReorderEvaluationScenariosUseCase,
    AddEvaluationQuestionUseCase,
    UpdateEvaluationQuestionUseCase,
    RemoveEvaluationQuestionUseCase,
    ReorderEvaluationQuestionsUseCase,
    AddEvaluationOptionUseCase,
    UpdateEvaluationOptionUseCase,
    RemoveEvaluationOptionUseCase,
    ReorderEvaluationOptionsUseCase,
    EvaluationAssignmentAccess,
    CreateEvaluationAssignmentsUseCase,
    GetEvaluationAssignmentsUseCase,
    GetManagedEvaluationAssignmentsUseCase,
    GetStudentEvaluationAssignmentsUseCase,
    UpdateEvaluationAssignmentUseCase,
    CloseEvaluationAssignmentUseCase,
    DeleteEvaluationAssignmentUseCase,
    EvaluationAttemptCloser,
    StudentAnswerRecorder,
    GetMyEvaluationsUseCase,
    StartEvaluationAttemptUseCase,
    GetEvaluationAttemptUseCase,
    SaveEvaluationAnswerUseCase,
    SubmitEvaluationAttemptUseCase,
    EvaluationGradingAccess,
    GetGradingQueueUseCase,
    GetAttemptForGradingUseCase,
    GradeEvaluationAnswerUseCase,
    PublishEvaluationAttemptGradeUseCase,
    PublishEvaluationGradesUseCase,
    EvaluationFacade,
    EvaluationEventsHandlers,
    GradeFeedbackAccess,
    GenerateGradeFeedbackUseCase,
    RegenerateGradeFeedbackUseCase,
    GetMyGradeFeedbackUseCase,
    GetGradeFeedbackUseCase,
    GradeFeedbackEventsHandlers,
  ],
  exports: [EvaluationFacade],
})
export class EvaluationModule {}

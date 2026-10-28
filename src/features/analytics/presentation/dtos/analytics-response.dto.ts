/*
 * Funcionalidad: DTOs de respuesta de analítica
 * Descripción: Contratos HTTP documentados con Swagger del panel de un grupo (nota aprobatoria y umbrales de riesgo vigentes, progreso agregado por módulo y fila por estudiante con progreso, notas, simulación, uso de IA, horas de ventilador, última actividad y riesgo), de la línea de tiempo de un estudiante, de las estadísticas de una evaluación (opcionalmente de un grupo) con dificultad por pregunta del resumen del propio estudiante y de cada columna del diccionario de datos de la exportación de investigación; fechas en ISO 8601 y valores ausentes como null; esquemas OpenAPI con nombre propio para no colisionar con clases homónimas de otras features (MyEvaluationDTO como AnalyticsEvaluationDTO, StudentProgressDTO como AnalyticsStudentProgressDTO). v1.6: MySummaryDTO.continueLearning (MyContinueLearningDTO o null)
 * Versión: 1.6
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

import { TIMELINE_ENTRY_KIND_VALUES } from "@/features/analytics/domain/services/activity-timeline";
import { STUDENT_RISK_REASON_VALUES } from "@/features/analytics/domain/services/student-risk";

const DATE_EXAMPLE: string = "2026-10-11T15:04:05.000Z";

const ID_EXAMPLE: string = "cm5x2k9a00000abcd1234efgh";

export class ProgressItemDTO {
  @ApiProperty({ description: "Section, level or module identifier (overall progress has none)", example: ID_EXAMPLE, nullable: true, type: String })
  public id: string | null;

  @ApiProperty({ description: "Section, level or module title (overall progress has none)", example: "Ventilation basics", nullable: true, type: String })
  public title: string | null;

  @ApiProperty({ description: "Completed lessons over published lessons, 0–100", example: 40 })
  public percentage: number;

  @ApiProperty({ description: "Completed lessons", example: 4 })
  public completedLessons: number;

  @ApiProperty({ description: "Published lessons", example: 10 })
  public totalLessons: number;

  @ApiProperty({ description: "Whether every published lesson is completed", example: false })
  public completed: boolean;
}

@ApiSchema({ name: "AnalyticsStudentProgressDTO" })
export class StudentProgressDTO {
  @ApiProperty({ description: "Progress over the whole published curriculum", type: ProgressItemDTO })
  public overall: ProgressItemDTO;

  @ApiProperty({ description: "Progress per published section", type: ProgressItemDTO, isArray: true })
  public sections: ProgressItemDTO[];

  @ApiProperty({ description: "Progress per published level", type: ProgressItemDTO, isArray: true })
  public levels: ProgressItemDTO[];

  @ApiProperty({ description: "Progress per published module", type: ProgressItemDTO, isArray: true })
  public modules: ProgressItemDTO[];
}

export class StudentEvaluationGradeDTO {
  @ApiProperty({ description: "Evaluation identifier", example: ID_EXAMPLE })
  public evaluationId: string;

  @ApiProperty({ description: "Evaluation title", example: "Ventilation basics" })
  public evaluationTitle: string;

  @ApiProperty({ description: "Attempt whose grade counts (the latest published one)", example: 1 })
  public attemptNumber: number;

  @ApiProperty({ description: "Published grade on the 0.0–5.0 scale", example: 4.2 })
  public grade: number;

  @ApiProperty({ description: "Whether the grade reaches the passing grade", example: true })
  public passed: boolean;

  @ApiProperty({ description: "When the grade was published", example: DATE_EXAMPLE })
  public publishedAt: string;
}

export class StudentGradesDTO {
  @ApiProperty({ description: "Average of the counted grade of each evaluation, null without published grades", example: 3.8, nullable: true, type: Number })
  public averageGrade: number | null;

  @ApiProperty({ description: "Counted grade per evaluation", type: StudentEvaluationGradeDTO, isArray: true })
  public evaluations: StudentEvaluationGradeDTO[];
}

export class StudentSimulationDTO {
  @ApiProperty({ description: "Simulation sessions started", example: 6 })
  public sessionCount: number;

  @ApiProperty({ description: "Average rubric score of the scored sessions, null when none is scored", example: 78.5, nullable: true, type: Number })
  public averageScore: number | null;

  @ApiProperty({
    description: "Average seconds until every target was met and held, from the persisted session summaries; null when no session stabilized",
    example: 142.3,
    nullable: true,
    type: Number,
  })
  public averageTimeToStabilizeSeconds: number | null;
}

export class StudentAiUsageDTO {
  @ApiProperty({ description: "AI use case (unknown for ratings without a linked call)", example: "FREE_CHAT" })
  public useCase: string;

  @ApiProperty({ description: "AI calls of the student", example: 12 })
  public calls: number;

  @ApiProperty({ description: "Input tokens", example: 5400 })
  public inputTokens: number;

  @ApiProperty({ description: "Output tokens", example: 2100 })
  public outputTokens: number;

  @ApiProperty({ description: "Ratings given by the student to outputs of this use case", example: 3 })
  public ratings: number;

  @ApiProperty({ description: "Percentage of ratings marked useful, null without ratings", example: 66.7, nullable: true, type: Number })
  public helpfulPercentage: number | null;
}

export class StudentDashboardRowDTO {
  @ApiProperty({ description: "Student identifier", example: ID_EXAMPLE })
  public userId: string;

  @ApiProperty({ description: "Student name", example: "Ana Gómez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "Student email", example: "ana@example.com" })
  public email: string;

  @ApiProperty({ description: "Learning progress", type: StudentProgressDTO })
  public progress: StudentProgressDTO;

  @ApiProperty({ description: "Published grades", type: StudentGradesDTO })
  public grades: StudentGradesDTO;

  @ApiProperty({ description: "Simulation sessions", type: StudentSimulationDTO })
  public simulation: StudentSimulationDTO;

  @ApiProperty({ description: "AI usage per use case", type: StudentAiUsageDTO, isArray: true })
  public aiUsage: StudentAiUsageDTO[];

  @ApiProperty({ description: "Hours of physical ventilator use in reservations held by the student", example: 1.5 })
  public ventilatorHours: number;

  @ApiProperty({
    description: "Latest learning activity of the student (page view or lesson progress update, simulation session start or end), null without recorded activity",
    example: "2026-10-01T14:30:00.000Z",
    nullable: true,
    type: String,
    format: "date-time",
  })
  public lastActivityAt: string | null;

  @ApiProperty({ description: "Whether any risk rule of the dashboard thresholds applies to the student", example: true })
  public atRisk: boolean;

  @ApiProperty({
    description:
      "Risk rules that apply: FAILED_EVALUATIONS (failed latest attempts above maxFailedEvaluations), LOW_PROGRESS (overall progress below minProgressPct), INACTIVE (lastActivityAt older than inactivityDays; never applies without recorded activity)",
    enum: STUDENT_RISK_REASON_VALUES,
    isArray: true,
    example: ["FAILED_EVALUATIONS"],
  })
  public riskReasons: string[];

  @ApiProperty({ description: "Evaluations whose latest published attempt (highest attempt number) is failed", type: String, isArray: true, example: [ID_EXAMPLE] })
  public failedEvaluationIds: string[];
}

export class RiskThresholdsDTO {
  @ApiProperty({ description: "Failed evaluations a student may have before being at risk (0: any failed evaluation flags the student)", example: 0 })
  public maxFailedEvaluations: number;

  @ApiProperty({ description: "Overall progress percentage below which a student is at risk (0 disables the rule)", example: 0 })
  public minProgressPct: number;

  @ApiProperty({ description: "Days without activity after which a student is at risk (0 disables the rule)", example: 0 })
  public inactivityDays: number;
}

export class GroupModuleSummaryDTO {
  @ApiProperty({ description: "Module identifier", example: ID_EXAMPLE })
  public moduleId: string;

  @ApiProperty({ description: "Module title", example: "Ventilation basics", nullable: true, type: String })
  public moduleTitle: string | null;

  @ApiProperty({ description: "Average module progress of the group's students (students without progress count as 0), 0–100", example: 62.5 })
  public averageProgressPct: number;

  @ApiProperty({ description: "Students who completed every published lesson of the module", example: 4 })
  public completedCount: number;

  @ApiProperty({ description: "Students of the group", example: 25 })
  public studentCount: number;
}

export class GroupDashboardDTO {
  @ApiProperty({ description: "Group identifier", example: ID_EXAMPLE })
  public groupId: string;

  @ApiProperty({ description: "Group name", example: "Group A" })
  public groupName: string;

  @ApiProperty({ description: "When the panel was computed (cached up to 60 s)", example: DATE_EXAMPLE })
  public generatedAt: string;

  @ApiProperty({ description: "Current passing grade (0–5 scale) used for the pass flags", example: 3 })
  public passingGrade: number;

  @ApiProperty({ description: "Current risk thresholds (platform settings analytics.risk.*)", type: RiskThresholdsDTO })
  public riskThresholds: RiskThresholdsDTO;

  @ApiProperty({ description: "Progress per published module aggregated over the group's students", type: GroupModuleSummaryDTO, isArray: true })
  public moduleSummary: GroupModuleSummaryDTO[];

  @ApiProperty({ description: "One row per student member", type: StudentDashboardRowDTO, isArray: true })
  public students: StudentDashboardRowDTO[];
}

export class TimelineEntryDTO {
  @ApiProperty({ description: "Activity kind", enum: TIMELINE_ENTRY_KIND_VALUES, example: "LESSON_COMPLETED" })
  public kind: string;

  @ApiProperty({ description: "When it happened", example: DATE_EXAMPLE })
  public occurredAt: string;

  @ApiProperty({ description: "Lesson, evaluation, simulation session or reservation identifier", example: ID_EXAMPLE })
  public referenceId: string;

  @ApiProperty({ description: "Lesson or evaluation title", example: "Lung compliance", nullable: true, type: String })
  public title: string | null;

  @ApiProperty({ description: "Attempt, session or reservation status", example: "GRADED", nullable: true, type: String })
  public status: string | null;

  @ApiProperty({ description: "Published grade of a submitted attempt or score of a session", example: 4.1, nullable: true, type: Number })
  public value: number | null;

  @ApiProperty({ description: "End of a session or reservation", example: DATE_EXAMPLE, nullable: true, type: String })
  public endedAt: string | null;
}

export class StudentTimelineDTO {
  @ApiProperty({ description: "Student identifier", example: ID_EXAMPLE })
  public userId: string;

  @ApiProperty({ description: "Range start (inclusive)", example: "2026-09-11T15:05:00.000Z" })
  public from: string;

  @ApiProperty({ description: "Range end (exclusive)", example: "2026-10-11T15:05:00.000Z" })
  public to: string;

  @ApiProperty({ description: "Activity, newest first", type: TimelineEntryDTO, isArray: true })
  public entries: TimelineEntryDTO[];

  @ApiProperty({ description: "Whether older entries were left out by the entry limit", example: false })
  public truncated: boolean;
}

export class GradeHistogramBucketDTO {
  @ApiProperty({ description: "Bucket start (inclusive)", example: 3 })
  public from: number;

  @ApiProperty({ description: "Bucket end (exclusive, inclusive for the last bucket)", example: 3.5 })
  public to: number;

  @ApiProperty({ description: "Graded attempts in the bucket", example: 4 })
  public count: number;
}

export class QuestionStatsDTO {
  @ApiProperty({ description: "Question identifier", example: ID_EXAMPLE })
  public questionId: string;

  @ApiProperty({ description: "Question order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Question type", example: "SINGLE_CHOICE" })
  public type: string;

  @ApiProperty({ description: "Question points", example: 2 })
  public points: number;

  @ApiProperty({ description: "Graded attempts with a score for the question", example: 18 })
  public answeredCount: number;

  @ApiProperty({ description: "Graded attempts with full points", example: 12 })
  public correctCount: number;

  @ApiProperty({ description: "Share of graded attempts with full points, 0–1", example: 0.6, nullable: true, type: Number })
  public correctRate: number | null;

  @ApiProperty({ description: "Difficulty index: mean share of the points earned over graded attempts (unanswered counts 0), 0–1", example: 0.64, nullable: true, type: Number })
  public difficultyIndex: number | null;
}

export class EvaluationAnalyticsDTO {
  @ApiProperty({ description: "Evaluation identifier", example: ID_EXAMPLE })
  public evaluationId: string;

  @ApiProperty({ description: "Group the statistics are limited to (groupId query), null for the whole requester scope", example: null, nullable: true, type: String })
  public groupId: string | null;

  @ApiProperty({ description: "Evaluation title", example: "Ventilation basics" })
  public title: string;

  @ApiProperty({ description: "Evaluation type", example: "EXAM" })
  public type: string;

  @ApiProperty({ description: "Attempts of every status", example: 24 })
  public totalAttempts: number;

  @ApiProperty({ description: "Graded attempts the grade statistics are computed on", example: 20 })
  public gradedCount: number;

  @ApiProperty({ description: "Attempts with a published grade", example: 20 })
  public publishedCount: number;

  @ApiProperty({ description: "Average grade", example: 3.62, nullable: true, type: Number })
  public averageGrade: number | null;

  @ApiProperty({ description: "Median grade", example: 3.7, nullable: true, type: Number })
  public medianGrade: number | null;

  @ApiProperty({ description: "Lowest grade", example: 1.4, nullable: true, type: Number })
  public minGrade: number | null;

  @ApiProperty({ description: "Highest grade", example: 5, nullable: true, type: Number })
  public maxGrade: number | null;

  @ApiProperty({ description: "Share of graded attempts at or above the passing grade, 0–1", example: 0.75, nullable: true, type: Number })
  public passRate: number | null;

  @ApiProperty({ description: "Configured passing grade", example: 3 })
  public passingGrade: number;

  @ApiProperty({ description: "Grade histogram in 0.5 buckets on the 0–5 scale", type: GradeHistogramBucketDTO, isArray: true })
  public histogram: GradeHistogramBucketDTO[];

  @ApiProperty({ description: "Item analysis per question", type: QuestionStatsDTO, isArray: true })
  public questions: QuestionStatsDTO[];
}

export class MyProgressDTO {
  @ApiProperty({ description: "Progress over the whole published curriculum", type: ProgressItemDTO })
  public overall: ProgressItemDTO;

  @ApiProperty({ description: "Progress per published section", type: ProgressItemDTO, isArray: true })
  public sections: ProgressItemDTO[];
}

export class MyGradeDTO {
  @ApiProperty({ description: "Graded attempt identifier", example: ID_EXAMPLE })
  public attemptId: string;

  @ApiProperty({ description: "Evaluation identifier", example: ID_EXAMPLE })
  public evaluationId: string;

  @ApiProperty({ description: "Evaluation title", example: "Ventilation basics" })
  public evaluationTitle: string;

  @ApiProperty({ description: "Evaluation type", example: "QUIZ" })
  public evaluationType: string;

  @ApiProperty({ description: "Module the evaluation belongs to (null when it is not tied to a module)", example: ID_EXAMPLE, nullable: true, type: String })
  public moduleId: string | null;

  @ApiProperty({ description: "Title of the module the evaluation belongs to", example: "Ventilation basics", nullable: true, type: String })
  public moduleTitle: string | null;

  @ApiProperty({ description: "Attempt number", example: 1 })
  public attemptNumber: number;

  @ApiProperty({ description: "Published grade on the 0.0–5.0 scale", example: 4.2 })
  public grade: number;

  @ApiProperty({ description: "Whether the grade reaches the passing grade", example: true })
  public passed: boolean;

  @ApiProperty({ description: "When the grade was published", example: DATE_EXAMPLE })
  public publishedAt: string;
}

@ApiSchema({ name: "AnalyticsEvaluationDTO" })
export class MyEvaluationDTO {
  @ApiProperty({ description: "Assignment identifier", example: ID_EXAMPLE })
  public assignmentId: string;

  @ApiProperty({ description: "Evaluation identifier", example: ID_EXAMPLE })
  public evaluationId: string;

  @ApiProperty({ description: "Evaluation title", example: "Ventilation basics" })
  public evaluationTitle: string;

  @ApiProperty({ description: "Evaluation type", example: "EXAM" })
  public evaluationType: string;

  @ApiProperty({ description: "Opening time", example: DATE_EXAMPLE })
  public startsAt: string;

  @ApiProperty({ description: "Closing time", example: DATE_EXAMPLE, nullable: true, type: String })
  public endsAt: string | null;
}

export class MyNoteDTO {
  @ApiProperty({ description: "Note identifier", example: ID_EXAMPLE })
  public id: string;

  @ApiProperty({ description: "Lesson identifier", example: ID_EXAMPLE })
  public lessonId: string;

  @ApiProperty({ description: "Page identifier", example: ID_EXAMPLE, nullable: true, type: String })
  public pageId: string | null;

  @ApiProperty({ description: "Module of the note's lesson", example: ID_EXAMPLE, nullable: true, type: String })
  public moduleId: string | null;

  @ApiProperty({ description: "Title of the note's lesson", example: "PEEP basics", nullable: true, type: String })
  public lessonTitle: string | null;

  @ApiProperty({ description: "Title of the page (content section) the note refers to; null without a page", example: "Alveolar recruitment", nullable: true, type: String })
  public pageTitle: string | null;

  @ApiProperty({ description: "Start of the note plain text", example: "PEEP keeps the alveoli open..." })
  public excerpt: string;

  @ApiProperty({ description: "Last update", example: DATE_EXAMPLE })
  public updatedAt: string;
}

export class MyConversationDTO {
  @ApiProperty({ description: "Conversation identifier", example: ID_EXAMPLE })
  public id: string;

  @ApiProperty({ description: "Conversation scope", example: "LESSON" })
  public scope: string;

  @ApiProperty({ description: "Referenced lesson, module or page", example: ID_EXAMPLE, nullable: true, type: String })
  public refId: string | null;

  @ApiProperty({ description: "Conversation title", example: "PEEP and oxygenation" })
  public title: string;

  @ApiProperty({ description: "Last update", example: DATE_EXAMPLE })
  public updatedAt: string;
}

export class MySimulationSessionDTO {
  @ApiProperty({ description: "Session identifier", example: ID_EXAMPLE })
  public id: string;

  @ApiProperty({ description: "Clinical case identifier", example: ID_EXAMPLE })
  public caseId: string;

  @ApiProperty({ description: "Clinical case title (null when the case no longer exists)", example: "Normal lung", nullable: true, type: String })
  public caseTitle: string | null;

  @ApiProperty({ description: "Session mode", example: "FREE" })
  public mode: string;

  @ApiProperty({ description: "Session status", example: "ENDED" })
  public status: string;

  @ApiProperty({ description: "Start time", example: DATE_EXAMPLE })
  public startedAt: string;

  @ApiProperty({ description: "End time", example: DATE_EXAMPLE, nullable: true, type: String })
  public endedAt: string | null;

  @ApiProperty({ description: "Persisted rubric score", example: 82, nullable: true, type: Number })
  public score: number | null;
}

export class MyReservationDTO {
  @ApiProperty({ description: "Reservation identifier", example: ID_EXAMPLE })
  public id: string;

  @ApiProperty({ description: "Holder type", example: "USER" })
  public holderType: string;

  @ApiProperty({ description: "Holder group when held by a group", example: ID_EXAMPLE, nullable: true, type: String })
  public groupId: string | null;

  @ApiProperty({ description: "Start time", example: DATE_EXAMPLE })
  public startsAt: string;

  @ApiProperty({ description: "End time", example: DATE_EXAMPLE })
  public endsAt: string;

  @ApiProperty({ description: "Purpose", example: "Practice", nullable: true, type: String })
  public purpose: string | null;
}

export class MyContinueLearningDTO {
  @ApiProperty({ description: "Module of the lesson to continue", example: "cm1module00001" })
  public moduleId: string;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public moduleTitle: string;

  @ApiProperty({ description: "Most recently accessed published lesson across all modules", example: "cm1lesson00001" })
  public lessonId: string;

  @ApiProperty({ description: "Lesson title", example: "Ecuación del movimiento" })
  public lessonTitle: string;

  @ApiProperty({ description: "Lesson-weighted completion percentage of the module (0-100)", example: 40 })
  public percent: number;
}

export class MySummaryDTO {
  @ApiProperty({ description: "Learning progress", type: MyProgressDTO })
  public progress: MyProgressDTO;

  @ApiProperty({ description: "Published grades, newest first", type: MyGradeDTO, isArray: true })
  public grades: MyGradeDTO[];

  @ApiProperty({ description: "Evaluations open now", type: MyEvaluationDTO, isArray: true })
  public activeEvaluations: MyEvaluationDTO[];

  @ApiProperty({ description: "Evaluations that open later", type: MyEvaluationDTO, isArray: true })
  public upcomingEvaluations: MyEvaluationDTO[];

  @ApiProperty({ description: "Latest notes", type: MyNoteDTO, isArray: true })
  public latestNotes: MyNoteDTO[];

  @ApiProperty({ description: "Latest AI tutor conversations", type: MyConversationDTO, isArray: true })
  public latestConversations: MyConversationDTO[];

  @ApiProperty({ description: "Latest simulation sessions", type: MySimulationSessionDTO, isArray: true })
  public latestSimulationSessions: MySimulationSessionDTO[];

  @ApiProperty({ description: "Upcoming ventilator reservations", type: MyReservationDTO, isArray: true })
  public upcomingReservations: MyReservationDTO[];

  @ApiProperty({ description: "Unread notifications", example: 3 })
  public unreadNotifications: number;

  @ApiProperty({
    description: "Where to resume studying: the most recently accessed lesson (UserProgress.lastAccessedAt) whose lesson and module are still published; null when there is none",
    type: MyContinueLearningDTO,
    nullable: true,
  })
  public continueLearning: MyContinueLearningDTO | null;
}

export class ResearchExportColumnDTO {
  @ApiProperty({ description: "CSV column name, in file order", example: "participant" })
  public column: string;

  @ApiProperty({ description: "Value type of the column", enum: ["string", "number"], example: "string" })
  public type: string;

  @ApiProperty({ description: "Meaning of the column and its allowed values (Spanish)", example: "Seudónimo del estudiante: HMAC-SHA256 del identificador de usuario" })
  public description: string;

  @ApiProperty({ description: "Example value (null when the column has none)", example: "progress", nullable: true, type: String })
  public example: string | null;
}

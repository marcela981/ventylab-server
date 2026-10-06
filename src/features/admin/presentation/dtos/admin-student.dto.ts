/*
 * Funcionalidad: DTOs de respuesta de estudiantes del panel de administración
 * Descripción: Formas de respuesta documentadas en Swagger para el listado de estudiantes y el detalle de actividad de un estudiante (perfil, grupos, módulos, lecciones, evaluaciones, quizzes, simulador, calificaciones y estadísticas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class AdminStudentListItemDTO {
  @ApiProperty({ description: "Student ID", example: "cm5student01" })
  public id: string;

  @ApiProperty({ description: "Student name", example: "Ana Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "Student email", example: "ana@example.com" })
  public email: string;

  @ApiProperty({ description: "Most recent module access", example: "2026-03-01T10:00:00.000Z", nullable: true, type: Date })
  public lastActivity: Date | null;

  @ApiProperty({ description: "Rounded average progress over started modules (0-100)", example: 45 })
  public overallProgress: number;

  @ApiProperty({ description: "Completed modules", example: 2 })
  public completedModules: number;

  @ApiProperty({ description: "Started modules", example: 5 })
  public totalModules: number;

  @ApiProperty({ description: "Name of the first group of the student", example: "Grupo A", nullable: true, type: String })
  public groupName: string | null;

  public constructor(fields: AdminStudentListItemDTO) {
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;
    this.lastActivity = fields.lastActivity;
    this.overallProgress = fields.overallProgress;
    this.completedModules = fields.completedModules;
    this.totalModules = fields.totalModules;
    this.groupName = fields.groupName;
  }
}

export class AdminStudentGroupDTO {
  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public id: string;

  @ApiProperty({ description: "Group name", example: "Grupo A" })
  public name: string;

  @ApiProperty({ description: "Group depth", example: 0 })
  public depth: number;

  @ApiProperty({ description: "Role of the student in the group", example: "STUDENT" })
  public memberRole: string;

  public constructor(fields: AdminStudentGroupDTO) {
    this.id = fields.id;
    this.name = fields.name;
    this.depth = fields.depth;
    this.memberRole = fields.memberRole;
  }
}

export class AdminStudentProfileDTO {
  @ApiProperty({ description: "Student ID", example: "cm5student01" })
  public id: string;

  @ApiProperty({ description: "Student name", example: "Ana Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "Student email", example: "ana@example.com" })
  public email: string;

  @ApiProperty({ description: "Platform role", example: "STUDENT" })
  public role: string;

  @ApiProperty({ description: "Profile image URL", example: null, nullable: true, type: String })
  public image: string | null;

  @ApiProperty({ description: "Account creation date", example: "2026-01-15T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Groups of the student", type: AdminStudentGroupDTO, isArray: true })
  public groups: AdminStudentGroupDTO[];

  public constructor(fields: AdminStudentProfileDTO) {
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;
    this.role = fields.role;
    this.image = fields.image;
    this.createdAt = fields.createdAt;
    this.groups = fields.groups;
  }
}

export class AdminModuleProgressDTO {
  @ApiProperty({ description: "Module ID", example: "cm5module01" })
  public moduleId: string;

  @ApiProperty({ description: "Module title", example: "Fundamentals" })
  public moduleTitle: string;

  @ApiProperty({ description: "Level title", example: "Beginner", nullable: true, type: String })
  public levelTitle: string | null;

  @ApiProperty({ description: "Progress status", example: "IN_PROGRESS" })
  public status: string;

  @ApiProperty({ description: "Progress percentage", example: 50 })
  public progressPercentage: number;

  @ApiProperty({ description: "Completed lessons", example: 3 })
  public completedLessons: number;

  @ApiProperty({ description: "Total lessons", example: 6 })
  public totalLessons: number;

  @ApiProperty({ description: "Time spent in seconds", example: 1800 })
  public timeSpentSeconds: number;

  @ApiProperty({ description: "Last access", example: "2026-03-01T10:00:00.000Z" })
  public lastAccessedAt: Date;

  @ApiProperty({ description: "Completion date", example: null, nullable: true, type: Date })
  public completedAt: Date | null;

  public constructor(fields: AdminModuleProgressDTO) {
    this.moduleId = fields.moduleId;
    this.moduleTitle = fields.moduleTitle;
    this.levelTitle = fields.levelTitle;
    this.status = fields.status;
    this.progressPercentage = fields.progressPercentage;
    this.completedLessons = fields.completedLessons;
    this.totalLessons = fields.totalLessons;
    this.timeSpentSeconds = fields.timeSpentSeconds;
    this.lastAccessedAt = fields.lastAccessedAt;
    this.completedAt = fields.completedAt;
  }
}

export class AdminLessonCompletionDTO {
  @ApiProperty({ description: "Lesson ID", example: "cm5lesson01" })
  public lessonId: string;

  @ApiProperty({ description: "Lesson title", example: "Ventilation modes" })
  public lessonTitle: string;

  @ApiProperty({ description: "Module ID", example: "cm5module01" })
  public moduleId: string;

  @ApiProperty({ description: "Whether the lesson is completed", example: true })
  public isCompleted: boolean;

  @ApiProperty({ description: "Current step index (0-based)", example: 4 })
  public currentStepIndex: number;

  @ApiProperty({ description: "Total steps", example: 5 })
  public totalSteps: number;

  @ApiProperty({ description: "Time spent in seconds", example: 600 })
  public timeSpentSeconds: number;

  @ApiProperty({ description: "Completion date", example: "2026-03-01T10:00:00.000Z", nullable: true, type: Date })
  public completedAt: Date | null;

  public constructor(fields: AdminLessonCompletionDTO) {
    this.lessonId = fields.lessonId;
    this.lessonTitle = fields.lessonTitle;
    this.moduleId = fields.moduleId;
    this.isCompleted = fields.isCompleted;
    this.currentStepIndex = fields.currentStepIndex;
    this.totalSteps = fields.totalSteps;
    this.timeSpentSeconds = fields.timeSpentSeconds;
    this.completedAt = fields.completedAt;
  }
}

export class AdminEvaluationAttemptDTO {
  @ApiProperty({ description: "Attempt ID", example: "cm5attempt01" })
  public attemptId: string;

  @ApiProperty({ description: "Clinical case ID", example: "cm5case01" })
  public caseId: string;

  @ApiProperty({ description: "Clinical case title", example: "ARDS case" })
  public caseTitle: string;

  @ApiProperty({ description: "Case difficulty", example: "INTERMEDIATE" })
  public difficulty: string;

  @ApiProperty({ description: "Case pathology", example: "ARDS" })
  public pathology: string;

  @ApiProperty({ description: "Score (0-100)", example: 82 })
  public score: number;

  @ApiProperty({ description: "Whether the attempt passed", example: true })
  public isSuccessful: boolean;

  @ApiProperty({ description: "Start date", example: "2026-03-01T10:00:00.000Z" })
  public startedAt: Date;

  @ApiProperty({ description: "Completion date", example: "2026-03-01T10:10:00.000Z", nullable: true, type: Date })
  public completedAt: Date | null;

  public constructor(fields: AdminEvaluationAttemptDTO) {
    this.attemptId = fields.attemptId;
    this.caseId = fields.caseId;
    this.caseTitle = fields.caseTitle;
    this.difficulty = fields.difficulty;
    this.pathology = fields.pathology;
    this.score = fields.score;
    this.isSuccessful = fields.isSuccessful;
    this.startedAt = fields.startedAt;
    this.completedAt = fields.completedAt;
  }
}

export class AdminQuizAttemptDTO {
  @ApiProperty({ description: "Quiz ID", example: "cm5quiz01" })
  public quizId: string;

  @ApiProperty({ description: "Quiz title", example: "Basics quiz" })
  public quizTitle: string;

  @ApiProperty({ description: "Score", example: 90 })
  public score: number;

  @ApiProperty({ description: "Whether the attempt passed", example: true })
  public passed: boolean;

  @ApiProperty({ description: "Start date", example: "2026-03-01T10:00:00.000Z" })
  public startedAt: Date;

  public constructor(fields: AdminQuizAttemptDTO) {
    this.quizId = fields.quizId;
    this.quizTitle = fields.quizTitle;
    this.score = fields.score;
    this.passed = fields.passed;
    this.startedAt = fields.startedAt;
  }
}

export class AdminSimulatorSessionDTO {
  @ApiProperty({ description: "Session ID", example: "cm5session01" })
  public sessionId: string;

  @ApiProperty({ description: "Whether the physical ventilator was used", example: false })
  public isRealVentilator: boolean;

  @ApiProperty({ description: "Start date", example: "2026-03-01T10:00:00.000Z" })
  public startedAt: Date;

  @ApiProperty({ description: "Completion date", example: null, nullable: true, type: Date })
  public completedAt: Date | null;

  @ApiProperty({ description: "Clinical case ID", example: null, nullable: true, type: String })
  public clinicalCaseId: string | null;

  public constructor(fields: AdminSimulatorSessionDTO) {
    this.sessionId = fields.sessionId;
    this.isRealVentilator = fields.isRealVentilator;
    this.startedAt = fields.startedAt;
    this.completedAt = fields.completedAt;
    this.clinicalCaseId = fields.clinicalCaseId;
  }
}

export class AdminGraderDTO {
  @ApiProperty({ description: "Teacher ID", example: "cm5teacher01" })
  public id: string;

  @ApiProperty({ description: "Teacher name", example: "Luis Gómez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "Teacher email", example: "luis@example.com" })
  public email: string;

  public constructor(fields: AdminGraderDTO) {
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;
  }
}

export class AdminScoreDTO {
  @ApiProperty({ description: "Score ID", example: "cm5score01" })
  public id: string;

  @ApiProperty({ description: "Type of the graded element", example: "MODULE" })
  public entityType: string;

  @ApiProperty({ description: "ID of the graded element", example: "cm5module01" })
  public entityId: string;

  @ApiProperty({ description: "Points", example: 85 })
  public points: number;

  @ApiProperty({ description: "Maximum points", example: 100 })
  public maxPoints: number;

  @ApiProperty({ description: "Comments", example: "Good work", nullable: true, type: String })
  public comments: string | null;

  @ApiProperty({ description: "Teacher who assigned the score", type: AdminGraderDTO })
  public grader: AdminGraderDTO;

  @ApiProperty({ description: "Creation date", example: "2026-03-01T10:00:00.000Z" })
  public createdAt: Date;

  public constructor(fields: AdminScoreDTO) {
    this.id = fields.id;
    this.entityType = fields.entityType;
    this.entityId = fields.entityId;
    this.points = fields.points;
    this.maxPoints = fields.maxPoints;
    this.comments = fields.comments;
    this.grader = fields.grader;
    this.createdAt = fields.createdAt;
  }
}

export class AdminStudentStatisticsDTO {
  @ApiProperty({ description: "Time spent across modules in seconds", example: 5400 })
  public totalTimeSpentSeconds: number;

  @ApiProperty({ description: "Completed modules", example: 2 })
  public completedModules: number;

  @ApiProperty({ description: "Started modules", example: 5 })
  public totalModules: number;

  @ApiProperty({ description: "Rounded average module progress", example: 45 })
  public overallProgress: number;

  @ApiProperty({ description: "Clinical case attempts", example: 4 })
  public evaluationsTaken: number;

  @ApiProperty({ description: "Successful clinical case attempts", example: 3 })
  public evaluationsPassed: number;

  @ApiProperty({ description: "Rounded pass rate (0-100)", example: 75 })
  public evaluationsPassRate: number;

  @ApiProperty({ description: "Rounded average clinical case score", example: 80 })
  public averageEvaluationScore: number;

  @ApiProperty({ description: "Simulator sessions", example: 2 })
  public simulatorSessions: number;

  @ApiProperty({ description: "Quiz attempts listed (up to 30)", example: 6 })
  public quizzesTaken: number;

  @ApiProperty({ description: "Unlocked achievements", example: 5 })
  public achievementsUnlocked: number;

  public constructor(fields: AdminStudentStatisticsDTO) {
    this.totalTimeSpentSeconds = fields.totalTimeSpentSeconds;
    this.completedModules = fields.completedModules;
    this.totalModules = fields.totalModules;
    this.overallProgress = fields.overallProgress;
    this.evaluationsTaken = fields.evaluationsTaken;
    this.evaluationsPassed = fields.evaluationsPassed;
    this.evaluationsPassRate = fields.evaluationsPassRate;
    this.averageEvaluationScore = fields.averageEvaluationScore;
    this.simulatorSessions = fields.simulatorSessions;
    this.quizzesTaken = fields.quizzesTaken;
    this.achievementsUnlocked = fields.achievementsUnlocked;
  }
}

export class AdminStudentProgressDTO {
  @ApiProperty({ description: "Student profile and groups", type: AdminStudentProfileDTO })
  public user: AdminStudentProfileDTO;

  @ApiProperty({ description: "Module progress, most recent access first", type: AdminModuleProgressDTO, isArray: true })
  public moduleProgress: AdminModuleProgressDTO[];

  @ApiProperty({ description: "Last 50 lesson records", type: AdminLessonCompletionDTO, isArray: true })
  public lessonCompletions: AdminLessonCompletionDTO[];

  @ApiProperty({ description: "Clinical case attempts, newest first", type: AdminEvaluationAttemptDTO, isArray: true })
  public evaluationAttempts: AdminEvaluationAttemptDTO[];

  @ApiProperty({ description: "Last 30 quiz attempts", type: AdminQuizAttemptDTO, isArray: true })
  public quizAttempts: AdminQuizAttemptDTO[];

  @ApiProperty({ description: "Simulator sessions, newest first", type: AdminSimulatorSessionDTO, isArray: true })
  public simulatorSessions: AdminSimulatorSessionDTO[];

  @ApiProperty({ description: "Scores from every teacher", type: AdminScoreDTO, isArray: true })
  public scores: AdminScoreDTO[];

  @ApiProperty({ description: "Derived statistics", type: AdminStudentStatisticsDTO })
  public statistics: AdminStudentStatisticsDTO;

  public constructor(fields: AdminStudentProgressDTO) {
    this.user = fields.user;
    this.moduleProgress = fields.moduleProgress;
    this.lessonCompletions = fields.lessonCompletions;
    this.evaluationAttempts = fields.evaluationAttempts;
    this.quizAttempts = fields.quizAttempts;
    this.simulatorSessions = fields.simulatorSessions;
    this.scores = fields.scores;
    this.statistics = fields.statistics;
  }
}

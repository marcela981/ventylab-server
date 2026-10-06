/*
 * Funcionalidad: DTOs de respuesta de relaciones profesor-estudiante
 * Descripción: Formas de respuesta documentadas en Swagger para relaciones, estudiantes y profesores asignados, resumen y detalle de progreso, verificación de asignación e ID de la relación creada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class TeacherStudentIdDTO {
  @ApiProperty({ description: "Identifier of the created relationship", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export class TeacherStudentPersonDTO {
  @ApiProperty({ description: "User ID", example: "cm5user01" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Ana Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User email", example: "ana@example.com" })
  public email: string;

  public constructor({ id, name, email }: { id: string; name: string | null; email: string }) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

export class TeacherStudentDTO {
  @ApiProperty({ description: "Relationship ID", example: "cm5rel01" })
  public id: string;

  @ApiProperty({ description: "Teacher user ID", example: "cm5teacher01" })
  public teacherId: string;

  @ApiProperty({ description: "Student user ID", example: "cm5student01" })
  public studentId: string;

  @ApiProperty({ description: "Assignment date", example: "2026-02-01T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Teacher", type: TeacherStudentPersonDTO })
  public teacher: TeacherStudentPersonDTO;

  @ApiProperty({ description: "Student", type: TeacherStudentPersonDTO })
  public student: TeacherStudentPersonDTO;

  public constructor({
    id,
    teacherId,
    studentId,
    createdAt,
    teacher,
    student,
  }: {
    id: string;
    teacherId: string;
    studentId: string;
    createdAt: Date;
    teacher: TeacherStudentPersonDTO;
    student: TeacherStudentPersonDTO;
  }) {
    this.id = id;
    this.teacherId = teacherId;
    this.studentId = studentId;
    this.createdAt = createdAt;
    this.teacher = teacher;
    this.student = student;
  }
}

export class LessonActivitySummaryDTO {
  @ApiProperty({ description: "Completed lessons", example: 12 })
  public completedLessons: number;

  @ApiProperty({ description: "Total time spent in seconds", example: 5400 })
  public totalTimeSpent: number;

  @ApiProperty({ description: "Last lesson access", example: "2026-03-01T10:00:00.000Z", nullable: true, type: Date })
  public lastAccess: Date | null;

  public constructor({ completedLessons, totalTimeSpent, lastAccess }: { completedLessons: number; totalTimeSpent: number; lastAccess: Date | null }) {
    this.completedLessons = completedLessons;
    this.totalTimeSpent = totalTimeSpent;
    this.lastAccess = lastAccess;
  }
}

export class AssignedStudentDTO extends TeacherStudentPersonDTO {
  @ApiProperty({ description: "Assignment date", example: "2026-02-01T10:00:00.000Z" })
  public assignedAt: Date;

  @ApiProperty({ description: "Lesson progress summary (only with includeProgress=true)", type: LessonActivitySummaryDTO, nullable: true })
  public progress: LessonActivitySummaryDTO | null;

  public constructor({
    id,
    name,
    email,
    assignedAt,
    progress,
  }: {
    id: string;
    name: string | null;
    email: string;
    assignedAt: Date;
    progress: LessonActivitySummaryDTO | null;
  }) {
    super({ id, name, email });
    this.assignedAt = assignedAt;
    this.progress = progress;
  }
}

export class AssignedTeacherDTO extends TeacherStudentPersonDTO {
  @ApiProperty({ description: "Assignment date", example: "2026-02-01T10:00:00.000Z" })
  public assignedAt: Date;

  public constructor({ id, name, email, assignedAt }: { id: string; name: string | null; email: string; assignedAt: Date }) {
    super({ id, name, email });
    this.assignedAt = assignedAt;
  }
}

export class StudentModuleProgressDTO {
  @ApiProperty({ description: "Module ID", example: "cm5module01" })
  public moduleId: string;

  @ApiProperty({ description: "Module title", example: "Fundamentals" })
  public moduleTitle: string;

  @ApiProperty({ description: "Rounded completion percentage over active lessons", example: 50 })
  public completionPercentage: number;

  @ApiProperty({ description: "Completed active lessons", example: 3 })
  public completedLessons: number;

  @ApiProperty({ description: "Active lessons in the module", example: 6 })
  public totalLessons: number;

  @ApiProperty({ description: "Time spent in the module lessons, in seconds", example: 1800 })
  public totalTimeSpent: number;

  @ApiProperty({ description: "Last access to a module lesson", example: "2026-03-01T10:00:00.000Z", nullable: true, type: Date })
  public lastAccess: Date | null;

  public constructor(fields: {
    moduleId: string;
    moduleTitle: string;
    completionPercentage: number;
    completedLessons: number;
    totalLessons: number;
    totalTimeSpent: number;
    lastAccess: Date | null;
  }) {
    this.moduleId = fields.moduleId;
    this.moduleTitle = fields.moduleTitle;
    this.completionPercentage = fields.completionPercentage;
    this.completedLessons = fields.completedLessons;
    this.totalLessons = fields.totalLessons;
    this.totalTimeSpent = fields.totalTimeSpent;
    this.lastAccess = fields.lastAccess;
  }
}

export class StudentOverallProgressDTO {
  @ApiProperty({ description: "Completed lessons across all modules", example: 12 })
  public totalCompletedLessons: number;

  @ApiProperty({ description: "Total time spent in seconds", example: 5400 })
  public totalTimeSpent: number;

  @ApiProperty({ description: "Last lesson access", example: "2026-03-01T10:00:00.000Z", nullable: true, type: Date })
  public lastAccess: Date | null;

  public constructor({
    totalCompletedLessons,
    totalTimeSpent,
    lastAccess,
  }: {
    totalCompletedLessons: number;
    totalTimeSpent: number;
    lastAccess: Date | null;
  }) {
    this.totalCompletedLessons = totalCompletedLessons;
    this.totalTimeSpent = totalTimeSpent;
    this.lastAccess = lastAccess;
  }
}

export class StudentDetailedProgressDTO {
  @ApiProperty({ description: "Student", type: TeacherStudentPersonDTO })
  public student: TeacherStudentPersonDTO;

  @ApiProperty({ description: "Progress per started module", type: StudentModuleProgressDTO, isArray: true })
  public modules: StudentModuleProgressDTO[];

  @ApiProperty({ description: "Overall progress", type: StudentOverallProgressDTO })
  public overall: StudentOverallProgressDTO;

  public constructor({
    student,
    modules,
    overall,
  }: {
    student: TeacherStudentPersonDTO;
    modules: StudentModuleProgressDTO[];
    overall: StudentOverallProgressDTO;
  }) {
    this.student = student;
    this.modules = modules;
    this.overall = overall;
  }
}

export class StudentAssignmentCheckDTO {
  @ApiProperty({ description: "Authenticated teacher ID", example: "cm5teacher01" })
  public teacherId: string;

  @ApiProperty({ description: "Student ID", example: "cm5student01" })
  public studentId: string;

  @ApiProperty({ description: "Whether the student is assigned to the teacher", example: true })
  public isAssigned: boolean;

  public constructor({ teacherId, studentId, isAssigned }: { teacherId: string; studentId: string; isAssigned: boolean }) {
    this.teacherId = teacherId;
    this.studentId = studentId;
    this.isAssigned = isAssigned;
  }
}

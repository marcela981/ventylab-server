/*
 * Funcionalidad: DTOs de respuesta de profesores y estadísticas del panel de administración
 * Descripción: Formas de respuesta documentadas en Swagger para el listado de profesores y las estadísticas de la plataforma, incluida la actividad reciente y la reserva activa del ventilador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class AdminTeacherGroupDTO {
  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public id: string;

  @ApiProperty({ description: "Group name", example: "Grupo A" })
  public name: string;

  public constructor(fields: AdminTeacherGroupDTO) {
    this.id = fields.id;
    this.name = fields.name;
  }
}

export class AdminTeacherDTO {
  @ApiProperty({ description: "User ID", example: "cm5teacher01" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Luis Gómez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User email", example: "luis@example.com" })
  public email: string;

  @ApiProperty({ description: "Platform role (TEACHER or ADMIN)", example: "TEACHER" })
  public role: string;

  @ApiProperty({ description: "Profile image URL", example: null, nullable: true, type: String })
  public image: string | null;

  @ApiProperty({ description: "Account creation date", example: "2026-01-15T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Groups where the user is a teacher", type: AdminTeacherGroupDTO, isArray: true })
  public groups: AdminTeacherGroupDTO[];

  @ApiProperty({ description: "Student memberships across those groups", example: 25 })
  public studentCount: number;

  @ApiProperty({ description: "Groups created by the user", example: 3 })
  public groupsCreated: number;

  public constructor(fields: AdminTeacherDTO) {
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;
    this.role = fields.role;
    this.image = fields.image;
    this.createdAt = fields.createdAt;
    this.groups = fields.groups;
    this.studentCount = fields.studentCount;
    this.groupsCreated = fields.groupsCreated;
  }
}

export class RecentActivityDTO {
  @ApiProperty({ description: "User ID", example: "cm5student01" })
  public userId: string;

  @ApiProperty({ description: "User name", example: "Ana Pérez", nullable: true, type: String })
  public userName: string | null;

  @ApiProperty({ description: "Action description", example: "Completó la lección: Ventilation modes" })
  public action: string;

  @ApiProperty({ description: "Completion date", example: "2026-03-01T10:00:00.000Z", nullable: true, type: Date })
  public timestamp: Date | null;

  public constructor(fields: RecentActivityDTO) {
    this.userId = fields.userId;
    this.userName = fields.userName;
    this.action = fields.action;
    this.timestamp = fields.timestamp;
  }
}

export class PlatformStatisticsDTO {
  @ApiProperty({ description: "Students", example: 120 })
  public totalStudents: number;

  @ApiProperty({ description: "Students with module access in the last 30 days", example: 80 })
  public activeStudents: number;

  @ApiProperty({ description: "Teachers", example: 6 })
  public totalTeachers: number;

  @ApiProperty({ description: "Admins", example: 2 })
  public totalAdmins: number;

  @ApiProperty({ description: "Active groups", example: 8 })
  public totalGroups: number;

  @ApiProperty({ description: "Active modules", example: 12 })
  public totalModules: number;

  @ApiProperty({ description: "Published modules (same as active modules)", example: 12 })
  public publishedModules: number;

  @ApiProperty({ description: "Active lessons", example: 60 })
  public totalLessons: number;

  @ApiProperty({ description: "Active clinical cases", example: 10 })
  public totalEvaluations: number;

  @ApiProperty({ description: "Simulator sessions", example: 40 })
  public totalSimulatorSessions: number;

  @ApiProperty({ description: "Rounded average progress across every module record", example: 42 })
  public averageProgress: number;

  @ApiProperty({ description: "Rounded percentage of students with at least one completed module", example: 30 })
  public completionRate: number;

  @ApiProperty({ description: "Lessons completed since local midnight", example: 5 })
  public completionsToday: number;

  @ApiProperty({ description: "Last 10 lesson completions", type: RecentActivityDTO, isArray: true })
  public recentActivity: RecentActivityDTO[];

  @ApiProperty({ description: "Whether a ventilator reservation is active", example: false })
  public hasActiveReservation: boolean;

  @ApiProperty({ description: "User of the active reservation", example: null, nullable: true, type: String })
  public activeReservationUserId: string | null;

  @ApiProperty({ description: "Group of the active reservation", example: null, nullable: true, type: String })
  public activeReservationGroupId: string | null;

  @ApiProperty({ description: "Leader of the active reservation", example: null, nullable: true, type: String })
  public activeReservationLeaderId: string | null;

  @ApiProperty({ description: "Generation date", example: "2026-03-01T10:00:00.000Z" })
  public generatedAt: Date;

  public constructor(fields: PlatformStatisticsDTO) {
    this.totalStudents = fields.totalStudents;
    this.activeStudents = fields.activeStudents;
    this.totalTeachers = fields.totalTeachers;
    this.totalAdmins = fields.totalAdmins;
    this.totalGroups = fields.totalGroups;
    this.totalModules = fields.totalModules;
    this.publishedModules = fields.publishedModules;
    this.totalLessons = fields.totalLessons;
    this.totalEvaluations = fields.totalEvaluations;
    this.totalSimulatorSessions = fields.totalSimulatorSessions;
    this.averageProgress = fields.averageProgress;
    this.completionRate = fields.completionRate;
    this.completionsToday = fields.completionsToday;
    this.recentActivity = fields.recentActivity;
    this.hasActiveReservation = fields.hasActiveReservation;
    this.activeReservationUserId = fields.activeReservationUserId;
    this.activeReservationGroupId = fields.activeReservationGroupId;
    this.activeReservationLeaderId = fields.activeReservationLeaderId;
    this.generatedAt = fields.generatedAt;
  }
}

/*
 * Funcionalidad: DTOs de respuesta de reservas
 * Descripción: Forma limitada de una reserva ajena para estudiantes (ventana, estado y etiqueta sin datos de otras personas), forma completa con titular, grupo y creador, y la reserva actual con si se puede controlar el ventilador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ReservationSummaryDTO {
  @ApiProperty({ description: "Projection: limited for other people's reservations seen by a student", example: "limited" })
  public visibility: "limited";

  @ApiProperty({ description: "Reservation identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Start of the reservation (ISO 8601)", example: "2026-10-12T14:00:00.000Z" })
  public startsAt: string;

  @ApiProperty({ description: "End of the reservation (ISO 8601)", example: "2026-10-12T15:00:00.000Z" })
  public endsAt: string;

  @ApiProperty({ description: "Lifecycle status", example: "SCHEDULED" })
  public status: string;

  @ApiProperty({ description: "Translated description of who holds it, without personal data", example: "Reserved by a student" })
  public label: string;

  @ApiProperty({ description: "Stable i18n key of the label", example: "reservations.labels.student" })
  public labelKey: string;

  public constructor(init: Omit<ReservationSummaryDTO, "visibility">) {
    this.visibility = "limited";
    this.id = init.id;
    this.startsAt = init.startsAt;
    this.endsAt = init.endsAt;
    this.status = init.status;
    this.label = init.label;
    this.labelKey = init.labelKey;
  }
}

export class ReservationPartyDTO {
  @ApiProperty({ description: "User identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Ana Gómez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User identifier shown to staff (email)", example: "ana@example.com" })
  public identifier: string;

  @ApiProperty({ description: "User role", example: "STUDENT" })
  public role: string;

  public constructor(init: ReservationPartyDTO) {
    this.id = init.id;
    this.name = init.name;
    this.identifier = init.identifier;
    this.role = init.role;
  }
}

export class ReservationGroupDTO {
  @ApiProperty({ description: "Group identifier", example: "cm5group01" })
  public id: string;

  @ApiProperty({ description: "Group name", example: "Group A" })
  public name: string;

  public constructor(init: ReservationGroupDTO) {
    this.id = init.id;
    this.name = init.name;
  }
}

export class ReservationDetailDTO {
  @ApiProperty({ description: "Projection: full for the viewer's own reservations, and for teachers and admins", example: "full" })
  public visibility: "full";

  @ApiProperty({ description: "Reservation identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Holder type", example: "USER" })
  public holderType: string;

  @ApiProperty({ description: "Start of the reservation (ISO 8601)", example: "2026-10-12T14:00:00.000Z" })
  public startsAt: string;

  @ApiProperty({ description: "End of the reservation (ISO 8601)", example: "2026-10-12T15:00:00.000Z" })
  public endsAt: string;

  @ApiProperty({ description: "Lifecycle status", example: "SCHEDULED" })
  public status: string;

  @ApiProperty({ description: "Purpose", example: "Practice", nullable: true, type: String })
  public purpose: string | null;

  @ApiProperty({ description: "Holder role (user role, or the role of the holder group's members)", example: "STUDENT" })
  public holderRole: string;

  @ApiProperty({ description: "Holder user", type: ReservationPartyDTO, nullable: true })
  public holder: ReservationPartyDTO | null;

  @ApiProperty({ description: "Holder group", type: ReservationGroupDTO, nullable: true })
  public group: ReservationGroupDTO | null;

  @ApiProperty({ description: "User who created the reservation", type: ReservationPartyDTO, nullable: true })
  public createdBy: ReservationPartyDTO | null;

  @ApiPropertyOptional({ description: "Reason given when the reservation was preempted", example: "Class demonstration", nullable: true, type: String })
  public preemptedReason: string | null;

  public constructor(init: Omit<ReservationDetailDTO, "visibility">) {
    this.visibility = "full";
    this.id = init.id;
    this.holderType = init.holderType;
    this.startsAt = init.startsAt;
    this.endsAt = init.endsAt;
    this.status = init.status;
    this.purpose = init.purpose;
    this.holderRole = init.holderRole;
    this.holder = init.holder;
    this.group = init.group;
    this.createdBy = init.createdBy;
    this.preemptedReason = init.preemptedReason;
  }
}

export type ReservationDTO = ReservationDetailDTO | ReservationSummaryDTO;

export class CurrentReservationDTO {
  @ApiProperty({ description: "Active reservation in the caller's projection, or null when the ventilator is free", nullable: true, type: ReservationDetailDTO })
  public reservation: ReservationDTO | null;

  @ApiProperty({ description: "Whether the caller may control the ventilator now (holder, member of the holder group, teacher or admin)", example: true })
  public canControl: boolean;

  public constructor(init: CurrentReservationDTO) {
    this.reservation = init.reservation;
    this.canControl = init.canControl;
  }
}

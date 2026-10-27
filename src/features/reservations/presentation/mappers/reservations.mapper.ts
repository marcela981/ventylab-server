/*
 * Funcionalidad: Presentador de reservas por rol
 * Descripción: Proyecta cada reserva según quien consulta: completa para docentes, administradores y las reservas propias o del grupo del estudiante; limitada (ventana, estado y etiqueta traducida, sin nombres, correos ni identificadores de otras personas) para las reservas ajenas que ve un estudiante; la reserva recién creada siempre en forma completa para quien la creó
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationView, type ReservationViewer, type ReservationUserView } from "@/features/reservations/domain/read-models/reservation.read-model";
import { STUDENT_ACTOR_ROLE } from "@/features/reservations/domain/services/reservation-access-policy";
import {
  CurrentReservationDTO,
  type ReservationDTO,
  ReservationDetailDTO,
  ReservationGroupDTO,
  ReservationPartyDTO,
  ReservationSummaryDTO,
} from "@/features/reservations/presentation/dtos/reservation.dto";

export type ReservationLabelTranslator = (key: string, args: Record<string, string>) => string;

export const GROUP_STUDENT_LABEL_KEY: string = "reservations.labels.group_student";
export const STUDENT_LABEL_KEY: string = "reservations.labels.student";
export const TEACHER_LABEL_KEY: string = "reservations.labels.teacher";

export class ReservationsPresentationMapper {
  public static toDTO(view: ReservationView, viewer: ReservationViewer, translate: ReservationLabelTranslator): ReservationDTO {
    if (viewer.role !== STUDENT_ACTOR_ROLE || ReservationsPresentationMapper._isOwn(view, viewer)) {
      return ReservationsPresentationMapper._toDetail(view);
    }

    const { key, args }: { key: string; args: Record<string, string> } = ReservationsPresentationMapper._label(view);

    return new ReservationSummaryDTO({
      id: view.reservation.id,
      startsAt: view.reservation.startsAt.toISOString(),
      endsAt: view.reservation.endsAt.toISOString(),
      status: view.reservation.status,
      label: translate(key, args),
      labelKey: key,
    });
  }

  public static toDTOList(views: readonly ReservationView[], viewer: ReservationViewer, translate: ReservationLabelTranslator): ReservationDTO[] {
    return views.map((view: ReservationView): ReservationDTO => ReservationsPresentationMapper.toDTO(view, viewer, translate));
  }

  /** A reservation the viewer just created is always their own, so it is projected in full */
  public static toCreatedDTO(view: ReservationView): ReservationDetailDTO {
    return ReservationsPresentationMapper._toDetail(view);
  }

  public static toCurrentDTO(
    view: ReservationView | undefined,
    canControl: boolean,
    viewer: ReservationViewer,
    translate: ReservationLabelTranslator,
  ): CurrentReservationDTO {
    return new CurrentReservationDTO({ reservation: view ? ReservationsPresentationMapper.toDTO(view, viewer, translate) : null, canControl });
  }

  private static _isOwn(view: ReservationView, viewer: ReservationViewer): boolean {
    const groupId: string | undefined = view.reservation.holder.groupId;

    return (
      view.reservation.holder.userId === viewer.userId ||
      view.reservation.createdById === viewer.userId ||
      (groupId !== undefined && viewer.groupIds.includes(groupId))
    );
  }

  private static _label(view: ReservationView): { key: string; args: Record<string, string> } {
    if (view.holderRole !== STUDENT_ACTOR_ROLE) {
      return { key: TEACHER_LABEL_KEY, args: {} };
    }

    if (view.holderGroup) {
      return { key: GROUP_STUDENT_LABEL_KEY, args: { group: view.holderGroup.name } };
    }

    return { key: STUDENT_LABEL_KEY, args: {} };
  }

  private static _toDetail(view: ReservationView): ReservationDetailDTO {
    return new ReservationDetailDTO({
      id: view.reservation.id,
      holderType: view.reservation.holder.type,
      startsAt: view.reservation.startsAt.toISOString(),
      endsAt: view.reservation.endsAt.toISOString(),
      status: view.reservation.status,
      purpose: view.reservation.purpose ?? null,
      holderRole: view.holderRole,
      holder: view.holderUser ? ReservationsPresentationMapper._toParty(view.holderUser) : null,
      group: view.holderGroup ? new ReservationGroupDTO({ id: view.holderGroup.id, name: view.holderGroup.name }) : null,
      createdBy: view.creator ? ReservationsPresentationMapper._toParty(view.creator) : null,
      preemptedReason: view.reservation.preemptedReason ?? null,
    });
  }

  private static _toParty(user: ReservationUserView): ReservationPartyDTO {
    return new ReservationPartyDTO({ id: user.id, name: user.name ?? null, identifier: user.email, role: user.role });
  }
}

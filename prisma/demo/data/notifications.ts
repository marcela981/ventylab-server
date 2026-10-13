/*
 * Funcionalidad: Semilla de notificaciones de la demostración
 * Descripción: Inserta o actualiza las notificaciones que habrían generado los eventos sembrados (evaluación activada por cada estudiante de los grupos asignados, calificación publicada por intento, reserva cancelada o desplazada y cambio de rol de un docente), con el texto de las plantillas del feature de notificaciones y una mezcla determinista de leídas y no leídas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type NotificationContent } from "@/features/notifications/domain/entities/notification.entity";
import { NOTIFICATION_TEMPLATES } from "@/features/notifications/domain/services/notification-templates";

import { DEMO_STUDENT_GROUPS, DEMO_TEACHERS, type DemoPerson, type DemoStudentGroup } from "../demo-cast";
import { addMinutes, type DemoContext, type DemoDb, demoId, upsertAll } from "../demo-support";

import { DEMO_PASSING_GRADE, type PublishedAttempt, type SeededEvaluation } from "./evaluations";
import { type DisplacedReservation } from "./reservations";

interface NotificationSeed {
  readonly key: string;
  readonly userId: string;
  readonly content: NotificationContent;
  readonly createdAt: Date;
  readonly read: boolean;
}

function row(seed: NotificationSeed): Prisma.NotificationCreateManyInput {
  return {
    id: demoId(`notification:${seed.key}`),
    userId: seed.userId,
    type: seed.content.type,
    title: seed.content.title,
    body: seed.content.body,
    data: seed.content.data,
    readAt: seed.read ? addMinutes(seed.createdAt, 90) : undefined,
    createdAt: seed.createdAt,
  };
}

export async function seedNotifications(
  db: DemoDb,
  context: DemoContext,
  sources: { readonly evaluations: readonly SeededEvaluation[]; readonly publishedAttempts: readonly PublishedAttempt[]; readonly displacedReservations: readonly DisplacedReservation[] },
): Promise<void> {
  const seeds: NotificationSeed[] = [];

  for (const evaluation of sources.evaluations.filter((candidate: SeededEvaluation) => candidate.state === "ACTIVE")) {
    for (const group of DEMO_STUDENT_GROUPS) {
      const assignmentId: string = evaluation.assignmentIds.get(group.id) ?? "";

      const content: NotificationContent = NOTIFICATION_TEMPLATES.evaluationActivated({
        eventId: demoId(`event:evaluation-activated:${assignmentId}`),
        occurredAt: evaluation.startsAt,
        assignmentId,
        evaluationId: evaluation.id,
        groupId: group.id,
        title: evaluation.title,
        type: evaluation.type,
        startsAt: evaluation.startsAt,
        endsAt: evaluation.endsAt,
      });

      for (const [index, member] of group.members.entries()) {
        seeds.push({ key: `evaluation-activated:${assignmentId}:${member.id}`, userId: member.id, content, createdAt: evaluation.startsAt, read: isReadByGroupMember(group, index) });
      }
    }
  }

  for (const [index, attempt] of sources.publishedAttempts.entries()) {
    const content: NotificationContent = NOTIFICATION_TEMPLATES.gradePublished({
      eventId: demoId(`event:grade-published:${attempt.id}`),
      occurredAt: attempt.publishedAt,
      attemptId: attempt.id,
      evaluationId: attempt.evaluationId,
      userId: attempt.userId,
      score: attempt.score,
      maxScore: attempt.maxScore,
      grade: attempt.grade,
      passed: attempt.grade >= DEMO_PASSING_GRADE,
      publishedAt: attempt.publishedAt,
    });

    seeds.push({ key: `grade-published:${attempt.id}`, userId: attempt.userId, content, createdAt: attempt.publishedAt, read: index % 3 !== 0 });
  }

  for (const reservation of sources.displacedReservations) {
    const holder: { readonly type: "USER"; readonly userId: string } = { type: "USER", userId: reservation.userId };
    const eventMeta: { readonly eventId: string; readonly occurredAt: Date } = { eventId: demoId(`event:reservation:${reservation.id}`), occurredAt: addMinutes(reservation.startsAt, -120) };

    const content: NotificationContent =
      reservation.status === "PREEMPTED" && reservation.replacedByReservationId
        ? NOTIFICATION_TEMPLATES.reservationPreempted({
          ...eventMeta,
          reservationId: reservation.id,
          previousHolder: holder,
          startsAt: reservation.startsAt,
          endsAt: reservation.endsAt,
          wasActive: false,
          reason: "Clase práctica programada por el docente",
          preemptedById: DEMO_TEACHERS[1].id,
          replacedByReservationId: reservation.replacedByReservationId,
        })
        : NOTIFICATION_TEMPLATES.reservationCancelled({ ...eventMeta, reservationId: reservation.id, holder, startsAt: reservation.startsAt, endsAt: reservation.endsAt, wasActive: false });

    seeds.push({ key: `reservation:${reservation.id}`, userId: reservation.userId, content, createdAt: eventMeta.occurredAt, read: false });
  }

  const promoted: DemoPerson = DEMO_TEACHERS[1];
  const promotedAt: Date = context.clock.at(-57, 9);

  seeds.push({
    key: `role-changed:${promoted.id}`,
    userId: promoted.id,
    content: NOTIFICATION_TEMPLATES.roleChanged({ eventId: demoId(`event:role-changed:${promoted.id}`), occurredAt: promotedAt, userId: promoted.id, previousRole: "STUDENT", newRole: "TEACHER" }),
    createdAt: promotedAt,
    read: true,
  });

  await upsertAll(seeds.map(row), (notification: Prisma.NotificationCreateManyInput, id: string) => db.notification.upsert({ where: { id }, create: notification, update: notification }));
}

function isReadByGroupMember(group: DemoStudentGroup, memberIndex: number): boolean {
  return group.id === DEMO_STUDENT_GROUPS[0].id ? memberIndex < 3 : memberIndex < 1;
}

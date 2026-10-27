/*
 * Funcionalidad: Contrato TypeScript de los eventos Socket.io
 * Descripción: Tipos de los mensajes que el cliente envía (authenticate y los ventilator:* reenviados), de los eventos que emite el servidor con su carga (la notificación como unión discriminada por type con el data de cada tipo) y de las salas a las que llegan; reflejan openapi/asyncapi.yaml, que es la fuente de verdad, y test/openapi/asyncapi-events.spec.ts verifica que todo evento emitido en src/ aparezca en ambos
 * Versión: 2.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface AuthenticatePayload {
  token: string;
}

export interface ClientToServerEvents {
  "authenticate": (payload: string | AuthenticatePayload) => void;
  "ventilator:join": () => void;
  "ventilator:heartbeat": () => void;
}

export interface ReservationPreemptedNotificationData {
  reservationId: string;
  replacedByReservationId: string;
}

export interface ReservationCancelledNotificationData {
  reservationId: string;
}

export interface EvaluationActivatedNotificationData {
  evaluationId: string;
  assignmentId: string;
}

export interface GradePublishedNotificationData {
  evaluationId: string;
  attemptId: string;
}

export interface FeedbackReadyNotificationData {
  evaluationId: string;
  attemptId: string;
  feedbackId: string;
}

export interface RoleChangedNotificationData {
  previousRole: string;
  newRole: string;
}

export interface VentilatorOfflineNotificationData {
  reservationId: string;
  reason: string;
}

export interface NotificationDataByType {
  RESERVATION_PREEMPTED: ReservationPreemptedNotificationData;
  RESERVATION_CANCELLED: ReservationCancelledNotificationData;
  EVALUATION_ACTIVATED: EvaluationActivatedNotificationData;
  GRADE_PUBLISHED: GradePublishedNotificationData;
  FEEDBACK_READY: FeedbackReadyNotificationData;
  ROLE_CHANGED: RoleChangedNotificationData;
  VENTILATOR_OFFLINE: VentilatorOfflineNotificationData;
}

export type NotificationType = keyof NotificationDataByType;

export interface NotificationPayloadOf<T extends NotificationType> {
  id: string;
  type: T;
  title: string;
  body: string;
  data: NotificationDataByType[T] | null;
  readAt: string | null;
  createdAt: string;
}

export type NotificationPayload = { [T in NotificationType]: NotificationPayloadOf<T> }[NotificationType];

export interface GradePublishedPayload {
  attemptId: string;
  evaluationId: string;
  score: number;
  maxScore: number;
  grade: number;
  passed: boolean;
  publishedAt: string;
}

export interface AchievementUnlockedPayload {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  unlockedAt: string;
  xpReward: number;
}

export interface ReservationPreemptedPayload {
  reservationId: string;
  holderType: "USER" | "GROUP";
  groupId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  wasActive: boolean;
}

export interface UserRoleChangedPayload {
  userId: string;
  previousRole: UserRole;
  newRole: UserRole;
}

export interface EvaluationActivatedPayload {
  evaluationId: string;
  assignmentId: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string;
}

export type SystemStateValue = "OK" | "DEGRADED" | "DOWN";

export interface SystemStatusChangedPayload {
  state: SystemStateValue;
  previousState: SystemStateValue;
  changedComponents: { component: string; state: string; previousState: string }[];
  checkedAt: string;
}

export interface TelemetryFrame {
  seq?: number;
  deviceTs?: number;
  serverTs: number;
  pressure: number;
  flow: number;
  volume: number;
  mode?: string;
  settings?: Record<string, number>;
  alarms?: string[];
  pco2?: number;
  spo2?: number;
  deviceId: string;
}

export interface VentilatorTelemetryPayload {
  frames: TelemetryFrame[];
  serverTs: number;
}

export interface VentilatorReadingPayload {
  pressure: number;
  flow: number;
  volume: number;
  pco2?: number;
  spo2?: number;
  timestamp: number;
  deviceId: string;
}

export interface VentilatorAlarmPayload {
  type: string;
  severity: string;
  message: string;
  currentValue?: number;
  thresholdValue?: number;
  timestamp: number;
  active: boolean;
  acknowledged: boolean;
}

export interface VentilatorAvailabilityPayload {
  occupied: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface VentilatorJoinRejectedPayload {
  reason: "no_active_reservation" | "not_reservation_holder";
}

export interface VentilatorConnectionPayload {
  at: number;
  reason?: "device_stale" | "broker_disconnected";
}

export interface VentilatorReservedPayload {
  userId: string;
  userName: string | null;
  reservationId: string;
  groupId: string | null;
  leaderId: null;
  endTime: number;
}

export interface VentilatorReleasedPayload {
  userId: string;
}

export interface VentilatorCommandStatusPayload {
  commandId: string;
  reservationId: string;
  userId: string;
  status: "PENDING" | "SENT" | "ACKED" | "APPLIED" | "REJECTED" | "TIMEOUT";
  sentAt?: string;
  resolvedAt?: string;
  latencyMs?: number;
  reason?: string;
}

export interface VentilatorControlChangedPayload {
  reservationId: string;
  operatorUserId: string | null;
  /** Projected per room: null for students who do not share the reservation with the operator, and when the control is released */
  operatorName: string | null;
  /** Generic label shown instead of a hidden operatorName */
  operatorLabelKey: "ventilator-commands.operator_labels.teacher" | "ventilator-commands.operator_labels.student" | null;
  reason: "taken" | "takeover" | "released" | "presence_timeout" | "reservation_ended" | "reservation_preempted";
}

export interface ServerToClientEvents {
  "authenticated": (payload: { userId: string }) => void;
  "auth_error": (payload: { message: string }) => void;
  "notification:new": (payload: NotificationPayload) => void;
  "grade:published": (payload: GradePublishedPayload) => void;
  "achievement:unlocked": (payload: AchievementUnlockedPayload) => void;
  "reservation:preempted": (payload: ReservationPreemptedPayload) => void;
  "user:role-changed": (payload: UserRoleChangedPayload) => void;
  "evaluation:activated": (payload: EvaluationActivatedPayload) => void;
  "system:status-changed": (payload: SystemStatusChangedPayload) => void;
  "ventilator:telemetry": (payload: VentilatorTelemetryPayload) => void;
  "ventilator:data": (payload: VentilatorReadingPayload) => void;
  "ventilator:alarm": (payload: VentilatorAlarmPayload) => void;
  "ventilator:availability": (payload: VentilatorAvailabilityPayload) => void;
  "ventilator:join-rejected": (payload: VentilatorJoinRejectedPayload) => void;
  "ventilator:connected": (payload: VentilatorConnectionPayload) => void;
  "ventilator:disconnected": (payload: VentilatorConnectionPayload) => void;
  "ventilator:reserved": (payload: VentilatorReservedPayload) => void;
  "ventilator:released": (payload: VentilatorReleasedPayload) => void;
  "ventilator:command-status": (payload: VentilatorCommandStatusPayload) => void;
  "ventilator:control-changed": (payload: VentilatorControlChangedPayload) => void;
}

export const SOCKET_ROOMS = {
  user: (userId: string): string => `user:${userId}`,
  group: (groupId: string): string => `group:${groupId}`,
  role: (role: UserRole): string => `role:${role}`,
  ventilator: "ventilator",
} as const;

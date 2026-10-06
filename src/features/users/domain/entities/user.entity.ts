/*
 * Funcionalidad: Entidad User
 * Descripción: Agregado de usuario con datos de perfil, rol, contraseña, estado activo, vínculo con Google y revocación de refresh tokens, y sus eventos y registros de auditoría
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import {
  UserCreatedEvent,
  UserGoogleAccountLinkedEvent,
  UserPasswordChangedEvent,
  UserProfileUpdatedEvent,
  UserRoleChangedEvent,
  UserStatusChangedEvent,
} from "@/features/users/domain/events/user.events";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

export const USER_ENTITY_COLLECTION: string = "users";
export const USER_ENTITY_TYPE: string = "user";

export type UserAuditAction =
  | "user_created"
  | "user_profile_updated"
  | "user_password_changed"
  | "user_role_changed"
  | "user_status_changed"
  | "user_google_account_linked";

export const USER_CREATED_AUDIT_ACTION: UserAuditAction = "user_created";
export const USER_PROFILE_UPDATED_AUDIT_ACTION: UserAuditAction = "user_profile_updated";
export const USER_PASSWORD_CHANGED_AUDIT_ACTION: UserAuditAction = "user_password_changed";
export const USER_ROLE_CHANGED_AUDIT_ACTION: UserAuditAction = "user_role_changed";
export const USER_STATUS_CHANGED_AUDIT_ACTION: UserAuditAction = "user_status_changed";
export const USER_GOOGLE_ACCOUNT_LINKED_AUDIT_ACTION: UserAuditAction = "user_google_account_linked";

export class User extends AggregateRoot {
  private _id: string;
  private _email: string;
  private _emailVerified?: Date;
  private _name?: string;
  private _passwordHash?: string;
  private _role: UserRole;
  private _image?: string;
  private _isActive: boolean;
  private _googleId?: string;
  private _refreshTokensRevokedAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<UserAuditAction>[];

  private constructor({
    id,
    email,
    emailVerified,
    name,
    passwordHash,
    role,
    image,
    isActive,
    googleId,
    refreshTokensRevokedAt,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    email: string;
    emailVerified?: Date;
    name?: string;
    passwordHash?: string;
    role: UserRole;
    image?: string;
    isActive: boolean;
    googleId?: string;
    refreshTokensRevokedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<UserAuditAction>[];
  }) {
    super();
    this._id = id;
    this._email = email;
    this._emailVerified = emailVerified;
    this._name = name;
    this._passwordHash = passwordHash;
    this._role = role;
    this._image = image;
    this._isActive = isActive;
    this._googleId = googleId;
    this._refreshTokensRevokedAt = refreshTokensRevokedAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get email(): string {
    return this._email;
  }

  public get emailVerified(): Date | undefined {
    return this._emailVerified;
  }

  public get name(): string | undefined {
    return this._name;
  }

  public get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  public get role(): UserRole {
    return this._role;
  }

  public get image(): string | undefined {
    return this._image;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get googleId(): string | undefined {
    return this._googleId;
  }

  public get refreshTokensRevokedAt(): Date | undefined {
    return this._refreshTokensRevokedAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<UserAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    email,
    name,
    passwordHash,
    role,
    image,
    googleId,
    performedBy,
  }: {
    email: string;
    name?: string;
    passwordHash?: string;
    role: UserRole;
    image?: string;
    googleId?: string;
    performedBy?: string;
  }): User {
    const now: Date = new Date();

    const user: User = new User({
      id: generateId(),
      email,
      emailVerified: undefined,
      name,
      passwordHash,
      role,
      image,
      isActive: true,
      googleId,
      refreshTokensRevokedAt: undefined,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<UserAuditAction>({
          action: USER_CREATED_AUDIT_ACTION,
          performedByUserId: performedBy,
          metadata: { role: role.value, provider: googleId ? "google" : "credentials" },
        }),
      ],
    });

    user.publishEvent(new UserCreatedEvent({ entity: user, performedBy }));

    return user;
  }

  public static reconstitute({
    id,
    email,
    emailVerified,
    name,
    passwordHash,
    role,
    image,
    isActive,
    googleId,
    refreshTokensRevokedAt,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    email: string;
    emailVerified?: Date;
    name?: string;
    passwordHash?: string;
    role: UserRole;
    image?: string;
    isActive: boolean;
    googleId?: string;
    refreshTokensRevokedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<UserAuditAction>[];
  }): User {
    return new User({
      id,
      email,
      emailVerified,
      name,
      passwordHash,
      role,
      image,
      isActive,
      googleId,
      refreshTokensRevokedAt,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public updateProfile({
    name,
    image,
    performedBy,
  }: {
    name?: string;
    image?: string | null;
    performedBy?: string;
  }): void {
    const changes: Record<string, { before: string | null; after: string | null }> = {};

    if (name !== undefined && name !== this._name) {
      changes.name = { before: this._name ?? null, after: name };
      this._name = name;
    }

    if (image !== undefined && (image ?? undefined) !== this._image) {
      changes.image = { before: this._image ?? null, after: image };
      this._image = image ?? undefined;
    }

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();

      this._auditLogs.push(
        AuditLog.create<UserAuditAction>({
          action: USER_PROFILE_UPDATED_AUDIT_ACTION,
          performedByUserId: performedBy,
          metadata: { changes },
        }),
      );

      this.publishEvent(new UserProfileUpdatedEvent({ entity: this, changes, performedBy }));
    }
  }

  public changePassword({ newPasswordHash, performedBy }: { newPasswordHash: string; performedBy?: string }): void {
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<UserAuditAction>({
        action: USER_PASSWORD_CHANGED_AUDIT_ACTION,
        performedByUserId: performedBy,
      }),
    );

    this.publishEvent(new UserPasswordChangedEvent({ entity: this, performedBy }));
  }

  // Role and status changes are audited by the use case through IAuditRecorder, which also captures the removed group memberships.
  public changeRole({ role, performedBy }: { role: UserRole; performedBy?: string }): void {
    if (role.equals(this._role)) {
      return;
    }

    const previousRole: string = this._role.value;
    const now: Date = new Date();

    this._role = role;
    this._refreshTokensRevokedAt = now;
    this._updatedAt = now;

    this.publishEvent(new UserRoleChangedEvent({ entity: this, previousRole, newRole: role.value, performedBy }));
  }

  public changeStatus({ isActive, performedBy }: { isActive: boolean; performedBy?: string }): void {
    if (isActive === this._isActive) {
      return;
    }

    const now: Date = new Date();

    this._isActive = isActive;
    this._updatedAt = now;

    if (!isActive) {
      this._refreshTokensRevokedAt = now;
    }

    this.publishEvent(new UserStatusChangedEvent({ entity: this, isActive, performedBy }));
  }

  public linkGoogleAccount({ googleId, image, performedBy }: { googleId: string; image?: string; performedBy?: string }): void {
    if (this._googleId === googleId) {
      return;
    }

    this._googleId = googleId;

    if (!this._image && image) {
      this._image = image;
    }

    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<UserAuditAction>({
        action: USER_GOOGLE_ACCOUNT_LINKED_AUDIT_ACTION,
        performedByUserId: performedBy,
      }),
    );

    this.publishEvent(new UserGoogleAccountLinkedEvent({ entity: this, performedBy }));
  }
}

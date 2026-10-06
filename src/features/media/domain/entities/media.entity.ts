/*
 * Funcionalidad: Entidad Media
 * Descripción: Agregado que representa un archivo cargado por un docente o administrador (tipo, MIME, tamaño, clave de almacenamiento y nombre original), con la regla de que no se elimina mientras alguna sección de página lo referencie
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import { MediaDeletedEvent, MediaUploadedEvent } from "@/features/media/domain/events/media.events";
import { MediaInUseError } from "@/features/media/domain/media.errors";
import { sanitizeFileName } from "@/features/media/domain/services/sanitize-file-name";
import { type MediaKindValue } from "@/features/media/domain/value-objects/media-kind";

export const MEDIA_ENTITY_COLLECTION: string = "media";
export const MEDIA_ENTITY_TYPE: string = "media";

export type MediaAuditAction = "media_uploaded" | "media_deleted";

export class Media extends AggregateRoot {
  private _id: string;
  private _ownerId: string;
  private _kind: MediaKindValue;
  private _mimeType: string;
  private _sizeBytes: number;
  private _storageKey: string;
  private _originalName: string;
  private _createdAt: Date;
  private _auditLogs: AuditLog<MediaAuditAction>[];

  private constructor({
    id,
    ownerId,
    kind,
    mimeType,
    sizeBytes,
    storageKey,
    originalName,
    createdAt,
    auditLogs,
  }: {
    id: string;
    ownerId: string;
    kind: MediaKindValue;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    originalName: string;
    createdAt: Date;
    auditLogs: AuditLog<MediaAuditAction>[];
  }) {
    super();
    this._id = id;
    this._ownerId = ownerId;
    this._kind = kind;
    this._mimeType = mimeType;
    this._sizeBytes = sizeBytes;
    this._storageKey = storageKey;
    this._originalName = originalName;
    this._createdAt = createdAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get ownerId(): string {
    return this._ownerId;
  }

  public get kind(): MediaKindValue {
    return this._kind;
  }

  public get mimeType(): string {
    return this._mimeType;
  }

  public get sizeBytes(): number {
    return this._sizeBytes;
  }

  public get storageKey(): string {
    return this._storageKey;
  }

  public get originalName(): string {
    return this._originalName;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<MediaAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    ownerId,
    kind,
    mimeType,
    sizeBytes,
    originalName,
  }: {
    ownerId: string;
    kind: MediaKindValue;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
  }): Media {
    const id: string = generateId();

    const media: Media = new Media({
      id,
      ownerId,
      kind,
      mimeType,
      sizeBytes,
      storageKey: `media/${kind.toLowerCase()}/${id}/${sanitizeFileName(originalName)}`,
      originalName,
      createdAt: new Date(),
      auditLogs: [
        AuditLog.create<MediaAuditAction>({
          action: "media_uploaded",
          performedByUserId: ownerId,
          metadata: { kind, mimeType, sizeBytes, originalName },
        }),
      ],
    });

    media.publishEvent(new MediaUploadedEvent({ entity: media, performedBy: ownerId }));

    return media;
  }

  public static reconstitute({
    id,
    ownerId,
    kind,
    mimeType,
    sizeBytes,
    storageKey,
    originalName,
    createdAt,
    auditLogs,
  }: {
    id: string;
    ownerId: string;
    kind: MediaKindValue;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    originalName: string;
    createdAt: Date;
    auditLogs: AuditLog<MediaAuditAction>[];
  }): Media {
    return new Media({ id, ownerId, kind, mimeType, sizeBytes, storageKey, originalName, createdAt, auditLogs });
  }

  public isOwnedBy(userId: string): boolean {
    return this._ownerId === userId;
  }

  public delete({ referenceCount, performedBy }: { referenceCount: number; performedBy: string }): void {
    if (referenceCount > 0) {
      throw new MediaInUseError();
    }

    this._auditLogs.push(
      AuditLog.create<MediaAuditAction>({
        action: "media_deleted",
        performedByUserId: performedBy,
        metadata: { ownerId: this._ownerId, kind: this._kind, storageKey: this._storageKey, originalName: this._originalName },
      }),
    );

    this.publishEvent(new MediaDeletedEvent({ entity: this, performedBy }));
  }
}

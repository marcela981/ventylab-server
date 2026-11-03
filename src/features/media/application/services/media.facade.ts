/*
 * Funcionalidad: Fachada pública de media
 * Descripción: API que MediaModule exporta para otras features (a través de la raíz de composición): sube una foto de perfil con la política de avatar (png, jpeg o webp de hasta 2 MB y bytes iniciales verificados) reutilizando UploadMediaUseCase y borra la media de un avatar anterior de su dueño con DeleteMediaUseCase
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { MediaAccessCommand } from "@/features/media/application/commands/media-access.command";
import { UploadMediaCommand } from "@/features/media/application/commands/upload-media.command";
import { DeleteMediaUseCase } from "@/features/media/application/use-cases/delete-media.usecase";
import { UploadMediaUseCase } from "@/features/media/application/use-cases/upload-media.usecase";
import { MediaUploadPolicy } from "@/features/media/domain/value-objects/media-upload-policy";

export interface AvatarUpload {
  readonly ownerId: string;
  readonly content: Buffer;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly originalName: string;
}

// Avatars are deleted by their owner; a role without "manage all media" keeps the ownership check.
const AVATAR_OWNER_ROLE: string = "STUDENT";

@Injectable()
export class MediaFacade {
  public constructor(
    private readonly _uploadMediaUseCase: UploadMediaUseCase,
    private readonly _deleteMediaUseCase: DeleteMediaUseCase,
  ) {}

  /**
   * @throws {MediaStorageUnavailableError} If no file storage is configured
   * @throws {UnsupportedMediaTypeError} If the file is not png, jpeg or webp
   * @throws {MediaTooLargeError} If the file exceeds 2 MB
   * @throws {MediaContentMismatchError} If the first bytes do not match the declared image type
   */
  public async uploadAvatar(upload: AvatarUpload): Promise<string> {
    return await this._uploadMediaUseCase.execute(
      new UploadMediaCommand({
        content: upload.content,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        originalName: upload.originalName,
        performedBy: upload.ownerId,
      }),
      MediaUploadPolicy.avatar(),
    );
  }

  public async deleteAvatar(mediaId: string, ownerId: string): Promise<void> {
    await this._deleteMediaUseCase.execute(new MediaAccessCommand({ mediaId, requester: { userId: ownerId, role: AVATAR_OWNER_ROLE, permissions: [] } }));
  }
}

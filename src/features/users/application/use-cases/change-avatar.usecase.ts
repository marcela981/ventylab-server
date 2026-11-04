/*
 * Funcionalidad: Casos de uso de la foto de perfil
 * Descripción: UpdateAvatarUseCase guarda la foto subida con el puerto IAvatarStorage, la asocia al usuario en una transacción (si falla, borra la media recién guardada) y después borra la foto anterior; RemoveAvatarUseCase quita la asociación y borra la media; el borrado de la media anterior es de mejor esfuerzo y se registra si falla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AVATAR_STORAGE_TOKEN, type AvatarFile, type IAvatarStorage } from "@/features/users/application/ports/avatar-storage.interface";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

abstract class AvatarUseCaseBase {
  protected readonly _logger: Logger = new Logger(this.constructor.name);

  public constructor(
    protected readonly _usersRepository: IUserRepository,
    protected readonly _transactionManager: ITransactionManager,
    protected readonly _avatarStorage: IAvatarStorage,
  ) {}

  /**
   * @throws {UserNotFoundError} If the user does not exist
   */
  protected async _setAvatar(userId: string, mediaId: string | undefined): Promise<{ user: User; previous?: string }> {
    return await this._transactionManager.run(async (transaction: unknown): Promise<{ user: User; previous?: string }> => {
      const user: User | undefined = await this._usersRepository.getById(userId, transaction);

      if (!user) {
        throw new UserNotFoundError();
      }

      const previous: string | undefined = user.changeAvatar({ mediaId, performedBy: userId });

      await this._usersRepository.save(user, transaction);

      return { user, previous };
    });
  }

  protected async _removeQuietly(mediaId: string | undefined, ownerId: string): Promise<void> {
    if (mediaId === undefined) {
      return;
    }

    await this._avatarStorage.remove(mediaId, ownerId).catch((error: unknown) => {
      this._logger.warn(`Avatar media ${mediaId} could not be removed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}

/**
 * @throws {UnsupportedMediaTypeError} If the file is not png, jpeg or webp (415)
 * @throws {MediaTooLargeError} If the file exceeds 2 MB (413)
 * @throws {MediaContentMismatchError} If the first bytes do not match the declared type (415)
 * @throws {MediaStorageUnavailableError} If no file storage is configured (503)
 * @throws {UserNotFoundError} If the user does not exist
 */
@Injectable()
export class UpdateAvatarUseCase extends AvatarUseCaseBase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN) usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN) transactionManager: ITransactionManager,
    @Inject(AVATAR_STORAGE_TOKEN) avatarStorage: IAvatarStorage,
  ) {
    super(usersRepository, transactionManager, avatarStorage);
  }

  public async execute(file: AvatarFile): Promise<User> {
    const mediaId: string = await this._avatarStorage.store(file);

    try {
      const { user, previous }: { user: User; previous?: string } = await this._setAvatar(file.ownerId, mediaId);

      await this._removeQuietly(previous, file.ownerId);

      return user;
    } catch (error) {
      await this._removeQuietly(mediaId, file.ownerId);

      throw error;
    }
  }
}

/**
 * @throws {UserNotFoundError} If the user does not exist
 */
@Injectable()
export class RemoveAvatarUseCase extends AvatarUseCaseBase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN) usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN) transactionManager: ITransactionManager,
    @Inject(AVATAR_STORAGE_TOKEN) avatarStorage: IAvatarStorage,
  ) {
    super(usersRepository, transactionManager, avatarStorage);
  }

  public async execute(userId: string): Promise<User> {
    const { user, previous }: { user: User; previous?: string } = await this._setAvatar(userId, undefined);

    await this._removeQuietly(previous, userId);

    return user;
  }
}

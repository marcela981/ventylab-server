/*
 * Funcionalidad: Pruebas de los casos de uso de la foto de perfil
 * Descripción: Verifica con dobles que subir la foto la guarde con el puerto, la asocie al usuario y borre la anterior; que si la asociación falla se borre la media nueva; que quitarla limpie la asociación y borre la media; y que un error al borrar la media anterior no haga fallar la operación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type AvatarFile, type IAvatarStorage } from "@/features/users/application/ports/avatar-storage.interface";
import { RemoveAvatarUseCase, UpdateAvatarUseCase } from "@/features/users/application/use-cases/change-avatar.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

const FILE: AvatarFile = { ownerId: "U1", content: Buffer.from([0x89]), mimeType: "image/png", sizeBytes: 1, originalName: "me.png" };

function buildUser(avatarMediaId?: string): User {
  const now: Date = new Date("2026-11-01T00:00:00Z");

  return User.reconstitute({ id: "U1", email: "ana@ventylab.test", role: UserRole.create("STUDENT"), isActive: true, avatarMediaId, createdAt: now, updatedAt: now, auditLogs: [] });
}

interface Harness {
  readonly repository: { getById: jest.Mock; save: jest.Mock };
  readonly storage: { store: jest.Mock; remove: jest.Mock };
  readonly update: UpdateAvatarUseCase;
  readonly remove: RemoveAvatarUseCase;
}

function build(user: User | undefined): Harness {
  const repository: { getById: jest.Mock; save: jest.Mock } = { getById: jest.fn().mockResolvedValue(user), save: jest.fn().mockResolvedValue(undefined) };
  const storage: { store: jest.Mock; remove: jest.Mock } = { store: jest.fn().mockResolvedValue("media-new"), remove: jest.fn().mockResolvedValue(undefined) };
  const transactions: ITransactionManager = { run: <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => work("tx") };
  const users: IUserRepository = repository as unknown as IUserRepository;
  const avatars: IAvatarStorage = storage;

  return { repository, storage, update: new UpdateAvatarUseCase(users, transactions, avatars), remove: new RemoveAvatarUseCase(users, transactions, avatars) };
}

describe("UpdateAvatarUseCase", () => {
  it("stores the photo, links it to the user and deletes the previous one", async () => {
    const { update, storage, repository }: Harness = build(buildUser("media-old"));

    const user: User = await update.execute(FILE);

    expect(storage.store).toHaveBeenCalledWith(FILE);
    expect(user.avatarMediaId).toBe("media-new");
    expect(repository.save).toHaveBeenCalledWith(user, "tx");
    expect(storage.remove).toHaveBeenCalledWith("media-old", "U1");
  });

  it("deletes the new media when the user cannot be updated", async () => {
    const { update, storage }: Harness = build(undefined);

    await expect(update.execute(FILE)).rejects.toBeInstanceOf(UserNotFoundError);
    expect(storage.remove).toHaveBeenCalledWith("media-new", "U1");
  });

  it("keeps the new photo when the previous media cannot be deleted", async () => {
    const { update, storage }: Harness = build(buildUser("media-old"));

    storage.remove.mockRejectedValue(new Error("storage down"));

    await expect(update.execute(FILE)).resolves.toBeInstanceOf(User);
  });
});

describe("RemoveAvatarUseCase", () => {
  it("clears the uploaded photo and deletes its media", async () => {
    const { remove, storage, repository }: Harness = build(buildUser("media-old"));

    const user: User = await remove.execute("U1");

    expect(user.avatarMediaId).toBeUndefined();
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(storage.remove).toHaveBeenCalledWith("media-old", "U1");
  });

  it("does nothing to storage when the user has no uploaded photo", async () => {
    const { remove, storage }: Harness = build(buildUser());

    await remove.execute("U1");

    expect(storage.remove).not.toHaveBeenCalled();
  });
});

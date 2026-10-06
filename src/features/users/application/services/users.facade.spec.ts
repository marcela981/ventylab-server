/*
 * Funcionalidad: Pruebas de UsersFacade
 * Descripción: Verifica la jerarquía de roles, la detección del superadmin y las tres ramas del alta o vinculación con Google (por googleId, por email y creación)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IPasswordHasher } from "@/common/application/security/password-hasher.interface";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { CreateUserUseCase } from "@/features/users/application/use-cases/create-user.usecase";
import { FindOrCreateGoogleUserUseCase } from "@/features/users/application/use-cases/find-or-create-google-user.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

const SUPERADMIN_EMAIL: string = "root@ventylab.com";
const GOOGLE_PROFILE: { googleId: string; email: string; name: string; avatarUrl: string } = {
  googleId: "google-123",
  email: "Ana@VentyLab.com",
  name: "Ana",
  avatarUrl: "https://example.com/ana.png",
};

interface Harness {
  facade: UsersFacade;
  save: jest.Mock;
  hash: jest.Mock;
}

function buildUser({ id, email, googleId, image }: { id: string; email: string; googleId?: string; image?: string }): User {
  const createdAt: Date = new Date("2026-01-01T00:00:00.000Z");

  return User.reconstitute({
    id,
    email,
    name: "Existing",
    passwordHash: "hash",
    role: UserRole.create("TEACHER"),
    image,
    isActive: true,
    googleId,
    createdAt,
    updatedAt: createdAt,
    auditLogs: [],
  });
}

function buildHarness(users: User[]): Harness {
  const save: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const hash: jest.Mock = jest.fn().mockResolvedValue("hashed");

  const usersRepository: IUserRepository = {
    getById: jest.fn().mockImplementation((id: string): Promise<User | undefined> => Promise.resolve(users.find((user: User) => user.id === id))),
    getByIds: jest.fn().mockImplementation((ids: string[]): Promise<User[]> => Promise.resolve(users.filter((user: User) => ids.includes(user.id)))),
    getByEmail: jest.fn().mockImplementation(
      (email: string): Promise<User | undefined> => Promise.resolve(users.find((user: User) => user.email.toLowerCase() === email.toLowerCase())),
    ),
    getByGoogleId: jest.fn().mockImplementation(
      (googleId: string): Promise<User | undefined> => Promise.resolve(users.find((user: User) => user.googleId === googleId)),
    ),
    save,
  } as unknown as IUserRepository;
  const transactionManager: ITransactionManager = { run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work("tx") };
  const eventBus: IEventBus = { publish: jest.fn() };
  const passwordHasher: IPasswordHasher = { hash, verify: jest.fn() };

  const createUserUseCase: CreateUserUseCase = new CreateUserUseCase(usersRepository, transactionManager, eventBus, passwordHasher, SUPERADMIN_EMAIL);
  const findOrCreateUseCase: FindOrCreateGoogleUserUseCase = new FindOrCreateGoogleUserUseCase(
    usersRepository,
    transactionManager,
    eventBus,
    createUserUseCase,
  );

  return { facade: new UsersFacade(usersRepository, findOrCreateUseCase, SUPERADMIN_EMAIL), save, hash };
}

describe("UsersFacade", () => {
  describe("hasRole", () => {
    it("applies the STUDENT < TEACHER < ADMIN hierarchy", () => {
      const { facade } = buildHarness([]);

      const decisions: boolean[] = [
        facade.hasRole({ role: "ADMIN" }, "TEACHER"),
        facade.hasRole({ role: "TEACHER" }, "TEACHER"),
        facade.hasRole({ role: "TEACHER" }, "ADMIN"),
        facade.hasRole({ role: "STUDENT" }, "TEACHER"),
      ];

      expect(decisions).toEqual([true, true, false, false]);
    });
  });

  describe("isSuperadmin", () => {
    it("matches the configured email case-insensitively from an email or a user", () => {
      const { facade } = buildHarness([]);

      const decisions: boolean[] = [
        facade.isSuperadmin(" ROOT@ventylab.com "),
        facade.isSuperadmin({ email: "root@VentyLab.com" }),
        facade.isSuperadmin("ana@ventylab.com"),
      ];

      expect(decisions).toEqual([true, true, false]);
    });
  });

  describe("findOrCreateFromGoogle", () => {
    it("returns the user already linked to the Google account", async () => {
      const linked: User = buildUser({ id: "U1", email: "other@ventylab.com", googleId: "google-123" });
      const { facade, save } = buildHarness([linked]);

      const account: UserAccount = await facade.findOrCreateFromGoogle(GOOGLE_PROFILE);

      expect(account).toMatchObject({ id: "U1", googleId: "google-123", isActive: true });
      expect(save).not.toHaveBeenCalled();
    });

    it("links the Google account to the user with the same email and fills an empty image", async () => {
      const existing: User = buildUser({ id: "U2", email: "ana@ventylab.com" });
      const { facade, save } = buildHarness([existing]);

      const account: UserAccount = await facade.findOrCreateFromGoogle(GOOGLE_PROFILE);

      expect(account).toMatchObject({ id: "U2", googleId: "google-123", image: "https://example.com/ana.png", role: "TEACHER" });
      expect(save).toHaveBeenCalledWith(existing, "tx");
    });

    it("keeps an existing image when linking by email", async () => {
      const existing: User = buildUser({ id: "U2", email: "ana@ventylab.com", image: "https://example.com/own.png" });
      const { facade } = buildHarness([existing]);

      const account: UserAccount = await facade.findOrCreateFromGoogle(GOOGLE_PROFILE);

      expect(account.image).toBe("https://example.com/own.png");
    });

    it("creates a student without password when no user matches", async () => {
      const { facade, save, hash } = buildHarness([]);

      const account: UserAccount = await facade.findOrCreateFromGoogle(GOOGLE_PROFILE);

      expect(account).toMatchObject({
        email: "Ana@VentyLab.com",
        name: "Ana",
        role: "STUDENT",
        googleId: "google-123",
        image: "https://example.com/ana.png",
        hasPassword: false,
        isActive: true,
      });
      expect(save).toHaveBeenCalledTimes(1);
      expect(hash).not.toHaveBeenCalled();
    });

    it("creates the superadmin as ADMIN", async () => {
      const { facade } = buildHarness([]);

      const account: UserAccount = await facade.findOrCreateFromGoogle({ ...GOOGLE_PROFILE, email: "Root@VentyLab.com" });

      expect(account.role).toBe("ADMIN");
    });
  });
});

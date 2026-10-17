/*
 * Funcionalidad: Pruebas de UsersPrismaRepository
 * Descripción: Verifica que la búsqueda del listado de usuarios coincide sin distinguir mayúsculas por nombre, email o código estudiantil, o exactamente por ID, que la búsqueda por código estudiantil usa el índice único y que el código se lee y se persiste con el usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type User } from "@/features/users/domain/entities/user.entity";
import { UsersPrismaRepository } from "@/features/users/infrastructure/persistence/prisma/repositories/users-prisma.repository";

interface PrismaMock {
  user: { findMany: jest.Mock; count: jest.Mock; findUnique: jest.Mock; upsert: jest.Mock };
}

const ROW: Record<string, unknown> = {
  id: "U1",
  email: "ana@ventylab.com",
  emailVerified: null,
  name: "Ana",
  password: null,
  role: "STUDENT",
  image: null,
  isActive: true,
  googleId: null,
  refreshTokensRevokedAt: null,
  studentCode: "2026-0001",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("UsersPrismaRepository", () => {
  let prisma: PrismaMock;
  let repository: UsersPrismaRepository;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([ROW]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue(ROW),
        upsert: jest.fn().mockResolvedValue(ROW),
      },
    };
    repository = new UsersPrismaRepository(prisma as unknown as PrismaService, { save: jest.fn() });
  });

  it("searches by name, email and student code case-insensitively or by exact ID", async () => {
    await repository.getAll({ page: 1, limit: 10, search: "2026" });

    expect(prisma.user.findMany.mock.calls[0][0].where.OR).toEqual([
      { name: { contains: "2026", mode: "insensitive" } },
      { email: { contains: "2026", mode: "insensitive" } },
      { studentCode: { contains: "2026", mode: "insensitive" } },
      { id: "2026" },
    ]);
  });

  it("finds a user by student code and persists the code with the user", async () => {
    const user: User | undefined = await repository.getByStudentCode("2026-0001");

    if (!user) {
      throw new Error("expected a user");
    }

    await repository.save(user);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { studentCode: "2026-0001" } });
    expect(user.studentCode).toBe("2026-0001");
    expect(prisma.user.upsert.mock.calls[0][0].create.studentCode).toBe("2026-0001");
  });
});

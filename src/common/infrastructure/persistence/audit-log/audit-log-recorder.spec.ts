/*
 * Funcionalidad: Pruebas de AuditLogRecorder y AuditLogPrismaRepository
 * Descripción: Verifica con una base de datos falsa que modela confirmación y reversión que el registrador escriba solo los campos cambiados dentro de la transacción del llamador, complete rol, petición e IP desde el contexto, nunca persista contraseñas, hashes ni tokens, guarde el referer sin query string, omita filas sin cambios ni motivo y que la reversión descarte el cambio y su auditoría
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_ACTIONS } from "@/common/domain/audit/audit-action";
import { type RequestContext, RequestContextService } from "@/common/infrastructure/context/request-context.service";
import { AuditLogPrismaRepository } from "@/common/infrastructure/persistence/audit-log/audit-log-prisma.repository";
import { AuditLogRecorder } from "@/common/infrastructure/persistence/audit-log/audit-log-recorder";
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";

type AuditRow = Prisma.AuditLogCreateManyInput;

interface FakeTransaction {
  readonly auditLog: { createMany: (args: { data: AuditRow[] }) => Promise<{ count: number }> };
  readonly user: { update: (args: { role: string }) => Promise<void> };
}

class FakeDatabase implements ITransactionManager {
  public readonly auditRows: AuditRow[] = [];
  public role: string = "STUDENT";

  public async run<T>(work: (transaction: unknown) => Promise<T>): Promise<T> {
    const stagedRows: AuditRow[] = [];
    let stagedRole: string = this.role;

    const transaction: FakeTransaction = {
      auditLog: {
        createMany: ({ data }: { data: AuditRow[] }): Promise<{ count: number }> => {
          stagedRows.push(...data);

          return Promise.resolve({ count: data.length });
        },
      },
      user: {
        update: ({ role }: { role: string }): Promise<void> => {
          stagedRole = role;

          return Promise.resolve();
        },
      },
    };

    const result: T = await work(transaction);

    this.auditRows.push(...stagedRows);
    this.role = stagedRole;

    return result;
  }
}

const UNUSED_PRISMA: PrismaService = {} as unknown as PrismaService;

function buildRecorder(context: RequestContextService = new RequestContextService()): AuditLogRecorder {
  return new AuditLogRecorder(new AuditLogPrismaRepository(UNUSED_PRISMA, context));
}

function requestContext(): RequestContext {
  return { method: "PATCH", path: "/api/users/u-2/role", traceId: "trace-1", agent: { ip: "203.0.113.10", userAgent: "jest", referer: "https://app.ventylab.test/admin/users?token=abc&page=2#row-7" }, actorRole: "ADMIN" };
}

describe("AuditLogRecorder", () => {
  it("persists only the changed fields inside the caller transaction", async () => {
    const database: FakeDatabase = new FakeDatabase();
    const recorder: AuditLogRecorder = buildRecorder();

    await database.run(async (transaction: unknown) => {
      await recorder.record("admin-1", AUDIT_ACTIONS.USER_ROLE_CHANGED, "users", "u-2", { role: "STUDENT", name: "Ana" }, { role: "TEACHER", name: "Ana" }, transaction, {
        reason: "Course coordinator",
      });
    });

    expect(database.auditRows).toHaveLength(1);
    expect(database.auditRows[0]).toMatchObject({
      action: "user_role_changed",
      entityCollection: "users",
      entityType: "users",
      entityId: "u-2",
      performedByUserId: "admin-1",
      before: { role: "STUDENT" },
      after: { role: "TEACHER" },
      reason: "Course coordinator",
    });
  });

  it("takes actor role, request id and IP from the request context", async () => {
    const database: FakeDatabase = new FakeDatabase();
    const context: RequestContextService = new RequestContextService();
    const recorder: AuditLogRecorder = buildRecorder(context);

    await new Promise<void>((resolve: () => void, reject: (error: unknown) => void) => {
      context.run(requestContext(), () => {
        database
          .run((transaction: unknown) => recorder.record("admin-1", AUDIT_ACTIONS.USER_STATUS_CHANGED, "users", "u-2", { status: "ACTIVE" }, { status: "INACTIVE" }, transaction))
          .then(resolve, reject);
      });
    });

    expect(database.auditRows[0]).toMatchObject({ actorRole: "ADMIN", requestId: "trace-1", ip: "203.0.113.10" });
  });

  it("stores the referer without its query string or fragment", async () => {
    const database: FakeDatabase = new FakeDatabase();
    const context: RequestContextService = new RequestContextService();
    const recorder: AuditLogRecorder = buildRecorder(context);

    await new Promise<void>((resolve: () => void, reject: (error: unknown) => void) => {
      context.run(requestContext(), () => {
        database
          .run((transaction: unknown) => recorder.record("admin-1", AUDIT_ACTIONS.USER_STATUS_CHANGED, "users", "u-2", { status: "ACTIVE" }, { status: "INACTIVE" }, transaction))
          .then(resolve, reject);
      });
    });

    const metadata: { agent: { referer: string } } = database.auditRows[0].metadata as unknown as { agent: { referer: string } };

    expect(metadata.agent.referer).toBe("https://app.ventylab.test/admin/users");
    expect(JSON.stringify(database.auditRows[0])).not.toContain("token=abc");
  });

  it("skips the write when nothing changed and no reason is given", async () => {
    const database: FakeDatabase = new FakeDatabase();
    const recorder: AuditLogRecorder = buildRecorder();

    await database.run(async (transaction: unknown) => {
      await recorder.record("admin-1", AUDIT_ACTIONS.USER_ROLE_CHANGED, "users", "u-2", { role: "STUDENT" }, { role: "STUDENT" }, transaction);
      await recorder.record("admin-1", AUDIT_ACTIONS.USER_ROLE_CHANGED, "users", "u-2", {}, {}, transaction, { reason: "   " });
    });

    expect(database.auditRows).toEqual([]);
  });

  it("keeps an unchanged entry when a reason is given", async () => {
    const database: FakeDatabase = new FakeDatabase();
    const recorder: AuditLogRecorder = buildRecorder();

    await database.run(async (transaction: unknown) => {
      await recorder.record("admin-1", AUDIT_ACTIONS.USER_ROLE_CHANGED, "users", "u-2", { role: "STUDENT" }, { role: "STUDENT" }, transaction, { reason: "Confirmed role" });
    });

    expect(database.auditRows).toHaveLength(1);
    expect(database.auditRows[0]).toMatchObject({ before: {}, after: {}, reason: "Confirmed role" });
  });

  it("never persists password, hash or token values", async () => {
    const database: FakeDatabase = new FakeDatabase();
    const recorder: AuditLogRecorder = buildRecorder();
    const secrets: string[] = ["OldSecret123", "NewSecret456", "$2b$10$oldhash", "$2b$10$newhash", "refresh-old", "refresh-new", "access-new"];

    await database.run(async (transaction: unknown) => {
      await recorder.record(
        "u-2",
        AUDIT_ACTIONS.PASSWORD_CHANGED,
        "users",
        "u-2",
        { password: "OldSecret123", passwordHash: "$2b$10$oldhash" },
        { password: "NewSecret456", passwordHash: "$2b$10$newhash" },
        transaction,
        { metadata: { currentPassword: "OldSecret123" } },
      );
      await recorder.record(
        "u-2",
        "session_tokens_rotated",
        "users",
        "u-2",
        { refreshToken: "refresh-old" },
        { refreshToken: "refresh-new", accessToken: "access-new" },
        transaction,
      );
    });

    const persisted: string = JSON.stringify(database.auditRows);

    expect(database.auditRows).toHaveLength(2);

    for (const secret of secrets) {
      expect(persisted).not.toContain(secret);
    }
  });

  it("discards the change and its audit row when the transaction rolls back after recording", async () => {
    const database: FakeDatabase = new FakeDatabase();
    const recorder: AuditLogRecorder = buildRecorder();

    const attempt: Promise<void> = database.run(async (transaction: unknown) => {
      await (transaction as FakeTransaction).user.update({ role: "TEACHER" });
      await recorder.record("admin-1", AUDIT_ACTIONS.USER_ROLE_CHANGED, "users", "u-2", { role: "STUDENT" }, { role: "TEACHER" }, transaction);

      throw new Error("forced failure after audit");
    });

    await expect(attempt).rejects.toThrow("forced failure after audit");
    expect(database.auditRows).toEqual([]);
    expect(database.role).toBe("STUDENT");
  });
});

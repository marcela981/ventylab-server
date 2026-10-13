/*
 * Funcionalidad: Pruebas unitarias del envío de una entrega de actividad
 * Descripción: Verifica que el caso de uso toma el candado del intento del estudiante antes de guardar y vuelve a leer la entrega bajo ese candado, de modo que un envío concurrente ya confirmado se rechaza con ActivitySubmissionAlreadyCompletedError (regresión BUG-10)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { SubmitSubmissionCommand } from "@/features/activities/application/commands/submit-submission.command";
import { SubmitSubmissionUseCase } from "@/features/activities/application/use-cases/submit-submission.usecase";
import { ActivitySubmissionAlreadyCompletedError } from "@/features/activities/domain/activities.errors";
import { ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import { type IActivitySubmissionsRepository } from "@/features/activities/domain/repositories/activity-submissions.repository";

const TRANSACTION: object = { id: "transaction" };
const ACTIVITY_ID: string = "activity-1";
const STUDENT_ID: string = "student-1";

interface Harness {
  readonly useCase: SubmitSubmissionUseCase;
  readonly calls: string[];
  readonly saved: ActivitySubmission[];
}

function draft(): ActivitySubmission {
  return ActivitySubmission.start({ activityId: ACTIVITY_ID, userId: STUDENT_ID, maxScore: 100 });
}

function buildHarness(firstRead: ActivitySubmission, readUnderLock: ActivitySubmission): Harness {
  const calls: string[] = [];
  const saved: ActivitySubmission[] = [];
  const reads: ActivitySubmission[] = [firstRead, readUnderLock];
  const submissions: Partial<IActivitySubmissionsRepository> = {
    getById: (): Promise<ActivitySubmission | undefined> => {
      calls.push("read");

      return Promise.resolve(reads.shift());
    },
    lockStudentAttempt: (activityId: string, userId: string, transaction: unknown): Promise<void> => {
      calls.push(`lock:${activityId}:${userId}:${transaction === TRANSACTION}`);

      return Promise.resolve();
    },
    save: (submission: ActivitySubmission): Promise<void> => {
      calls.push("save");
      saved.push(submission);

      return Promise.resolve();
    },
  };
  const activities: Partial<IActivitiesRepository> = { getById: (): Promise<undefined> => Promise.resolve(undefined) };
  const transactionManager: ITransactionManager = { run: <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => work(TRANSACTION) };
  const eventBus: IEventBus = { publish: (): void => undefined };

  return {
    useCase: new SubmitSubmissionUseCase(submissions as IActivitySubmissionsRepository, activities as IActivitiesRepository, transactionManager, eventBus),
    calls,
    saved,
  };
}

describe("SubmitSubmissionUseCase", () => {
  it("should lock the student attempt and re-read the submission before saving it", async () => {
    const submission: ActivitySubmission = draft();
    const harness: Harness = buildHarness(submission, submission);

    await harness.useCase.execute(new SubmitSubmissionCommand({ submissionId: submission.id, userId: STUDENT_ID, requesterRole: "STUDENT" }));

    expect(harness.calls).toEqual(["read", `lock:${ACTIVITY_ID}:${STUDENT_ID}:true`, "read", "save"]);
    expect(harness.saved[0].status).toBe("SUBMITTED");
  });

  it("should reject a submit when a concurrent one committed before the lock was granted", async () => {
    const firstRead: ActivitySubmission = draft();
    const committed: ActivitySubmission = draft();

    committed.submit(undefined, STUDENT_ID);

    const harness: Harness = buildHarness(firstRead, committed);

    const execution: Promise<void> = harness.useCase.execute(new SubmitSubmissionCommand({ submissionId: firstRead.id, userId: STUDENT_ID, requesterRole: "STUDENT" }));

    await expect(execution).rejects.toBeInstanceOf(ActivitySubmissionAlreadyCompletedError);
    expect(harness.saved).toEqual([]);
  });
});

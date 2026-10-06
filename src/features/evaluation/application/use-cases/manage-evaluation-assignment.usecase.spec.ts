/*
 * Funcionalidad: Pruebas de la gestión de asignaciones de evaluación
 * Descripción: Verifica la edición de la ventana, el cierre anticipado y el borrado de una asignación: pertenencia a la evaluación (404), alcance del grupo (403), solapamiento al editar, bloqueo del borrado con intentos (409) y auditoría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CloseEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/close-evaluation-assignment.command";
import { DeleteEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/delete-evaluation-assignment.command";
import { UpdateEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/update-evaluation-assignment.command";
import {
  type AssignmentsDoubles,
  type AssignmentsState,
  buildAssignment,
  buildAssignmentDoubles,
  fromNow,
  savedAssignments,
} from "@/features/evaluation/application/testing/evaluation-assignment-test-doubles-spec";
import { OTHER_TEACHER } from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { CloseEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/close-evaluation-assignment.usecase";
import { DeleteEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/delete-evaluation-assignment.usecase";
import { UpdateEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-assignment.usecase";
import {
  EvaluationAlreadyAssignedError,
  EvaluationAssignmentClosedError,
  EvaluationAssignmentForbiddenError,
  EvaluationAssignmentHasAttemptsError,
  EvaluationAssignmentNotFoundError,
} from "@/features/evaluation/domain/evaluation.errors";

function managedState(overrides: AssignmentsState = {}): AssignmentsState {
  return { assignments: [buildAssignment()], managedGroupIds: ["group-1"], ...overrides };
}

function update(doubles: AssignmentsDoubles, { evaluationId = "evaluation-1", endsAt = fromNow(8) }: { evaluationId?: string; endsAt?: Date } = {}): Promise<void> {
  return new UpdateEvaluationAssignmentUseCase(
    doubles.evaluationsRepository,
    doubles.assignmentsRepository,
    doubles.access,
    doubles.transactionManager,
    doubles.auditRecorder,
  ).execute(new UpdateEvaluationAssignmentCommand({ evaluationId, assignmentId: "assignment-1", actor: OTHER_TEACHER, endsAt }));
}

function close(doubles: AssignmentsDoubles): Promise<void> {
  return new CloseEvaluationAssignmentUseCase(
    doubles.evaluationsRepository,
    doubles.assignmentsRepository,
    doubles.access,
    doubles.transactionManager,
    doubles.auditRecorder,
  ).execute(new CloseEvaluationAssignmentCommand({ evaluationId: "evaluation-1", assignmentId: "assignment-1", actor: OTHER_TEACHER }));
}

function remove(doubles: AssignmentsDoubles): Promise<void> {
  return new DeleteEvaluationAssignmentUseCase(
    doubles.evaluationsRepository,
    doubles.assignmentsRepository,
    doubles.access,
    doubles.transactionManager,
    doubles.auditRecorder,
  ).execute(new DeleteEvaluationAssignmentCommand({ evaluationId: "evaluation-1", assignmentId: "assignment-1", actor: OTHER_TEACHER }));
}

describe("UpdateEvaluationAssignmentUseCase", () => {
  it("changes the end of an active assignment and audits it", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState());
    const endsAt: Date = fromNow(8);

    await update(doubles, { endsAt });

    expect(savedAssignments(doubles)[0].endsAt).toEqual(endsAt);
    expect(doubles.acquireLock).toHaveBeenCalledWith("evaluations:structure:evaluation-1", "tx");
    expect(doubles.record.mock.calls[0][1]).toBe("evaluation_assignment_window_changed");
  });

  it("rejects an assignment of another evaluation", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState());

    await expect(update(doubles, { evaluationId: "evaluation-2" })).rejects.toBeInstanceOf(EvaluationAssignmentNotFoundError);
  });

  it("forbids editing an assignment of a group the teacher does not manage", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState({ managedGroupIds: [] }));

    await expect(update(doubles)).rejects.toBeInstanceOf(EvaluationAssignmentForbiddenError);
    expect(doubles.save).not.toHaveBeenCalled();
  });

  it("rejects an extension that overlaps another assignment of the group", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(
      managedState({ assignments: [buildAssignment(), buildAssignment({ id: "assignment-2", startsAt: fromNow(6), endsAt: fromNow(9) })] }),
    );

    await expect(update(doubles, { endsAt: fromNow(7) })).rejects.toBeInstanceOf(EvaluationAlreadyAssignedError);
  });
});

describe("CloseEvaluationAssignmentUseCase", () => {
  it("closes an active assignment now and audits it", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState());

    await close(doubles);

    expect(savedAssignments(doubles)[0].stateAt(fromNow(0.01))).toBe("CLOSED");
    expect(doubles.record.mock.calls[0][1]).toBe("evaluation_assignment_closed");
  });

  it("rejects closing a closed assignment", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState({ assignments: [buildAssignment({ startsAt: fromNow(-5), endsAt: fromNow(-1) })] }));

    await expect(close(doubles)).rejects.toBeInstanceOf(EvaluationAssignmentClosedError);
  });

  it("rejects an unknown assignment", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState({ assignments: [] }));

    await expect(close(doubles)).rejects.toBeInstanceOf(EvaluationAssignmentNotFoundError);
  });
});

describe("DeleteEvaluationAssignmentUseCase", () => {
  it("deletes an assignment without attempts and audits it", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState());

    await remove(doubles);

    expect(doubles.remove).toHaveBeenCalledWith("assignment-1", "tx");
    expect(doubles.record.mock.calls[0][1]).toBe("evaluation_assignment_deleted");
  });

  it("rejects deleting an assignment with attempts", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState({ attempts: 2 }));

    await expect(remove(doubles)).rejects.toBeInstanceOf(EvaluationAssignmentHasAttemptsError);
    expect(doubles.remove).not.toHaveBeenCalled();
  });

  it("forbids deleting an assignment of a group the teacher does not manage", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(managedState({ managedGroupIds: [] }));

    await expect(remove(doubles)).rejects.toBeInstanceOf(EvaluationAssignmentForbiddenError);
  });
});

/*
 * Funcionalidad: Pruebas de la activación de evaluaciones
 * Descripción: Verifica la activación todo-o-nada por grupos (403 si el profesor no gestiona algún grupo, prueba 17), el requisito READY, el tipo y estado del grupo destino, el solapamiento de ventanas, el candado, la auditoría y la publicación del evento después del commit
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CreateEvaluationAssignmentsCommand } from "@/features/evaluation/application/commands/create-evaluation-assignments.command";
import {
  type AssignmentsDoubles,
  type AssignmentsState,
  buildAssignment,
  buildAssignmentDoubles,
  fromNow,
  savedAssignments,
  studentGroup,
} from "@/features/evaluation/application/testing/evaluation-assignment-test-doubles-spec";
import { ADMIN, buildEvaluation, OTHER_TEACHER, OWNER } from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { CreateEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/create-evaluation-assignments.usecase";
import {
  EvaluationAlreadyAssignedError,
  EvaluationAssignmentForbiddenError,
  EvaluationNotActivatableError,
  EvaluationNotFoundError,
  InvalidEvaluationAssignmentGroupError,
  InvalidEvaluationAssignmentWindowError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationActivatedEvent } from "@/features/evaluation/domain/events/evaluation-assignment.events";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

function readyState(overrides: AssignmentsState = {}): AssignmentsState {
  return {
    evaluations: [buildEvaluation({ ready: true })],
    groups: [studentGroup("group-1"), studentGroup("group-2")],
    managedGroupIds: ["group-1", "group-2"],
    ...overrides,
  };
}

function execute(
  doubles: AssignmentsDoubles,
  { actor = OTHER_TEACHER, groupIds = ["group-1", "group-2"], startsAt = fromNow(1), endsAt = fromNow(3) }: Partial<{
    actor: EvaluationActor;
    groupIds: string[];
    startsAt: Date;
    endsAt: Date;
  }> = {},
): Promise<string[]> {
  return new CreateEvaluationAssignmentsUseCase(
    doubles.evaluationsRepository,
    doubles.assignmentsRepository,
    doubles.access,
    doubles.transactionManager,
    doubles.eventBus,
    doubles.auditRecorder,
  ).execute(new CreateEvaluationAssignmentsCommand({ evaluationId: "evaluation-1", actor, groupIds, startsAt, endsAt }));
}

describe("CreateEvaluationAssignmentsUseCase", () => {
  it("creates one assignment per managed group for any READY evaluation of the shared bank", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState());

    const ids: string[] = await execute(doubles);

    expect(ids).toHaveLength(2);
    expect(savedAssignments(doubles).map((assignment: { groupId: string }) => assignment.groupId)).toEqual(["group-1", "group-2"]);
    expect(doubles.acquireLock).toHaveBeenCalledWith("evaluations:structure:evaluation-1", "tx");
    expect(doubles.record).toHaveBeenCalledTimes(2);
    expect(doubles.record.mock.calls[0][1]).toBe("evaluation_assignment_created");
  });

  it("publishes one activation event per group after the transaction", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState());

    await execute(doubles);

    expect(doubles.publish).toHaveBeenCalledTimes(1);
    expect(doubles.publish.mock.calls[0][0]).toHaveLength(2);
    expect(doubles.publish.mock.calls[0][0][0]).toBeInstanceOf(EvaluationActivatedEvent);
    expect(doubles.save.mock.invocationCallOrder[1]).toBeLessThan(doubles.publish.mock.invocationCallOrder[0]);
  });

  it("deduplicates repeated group IDs", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState());

    const ids: string[] = await execute(doubles, { groupIds: ["group-1", "group-1"] });

    expect(ids).toHaveLength(1);
  });

  it("forbids a teacher activating for a group they do not manage (check 17) and creates nothing", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState({ managedGroupIds: ["group-1"] }));

    await expect(execute(doubles, { groupIds: ["group-1", "group-2"] })).rejects.toBeInstanceOf(EvaluationAssignmentForbiddenError);
    expect(doubles.save).not.toHaveBeenCalled();
    expect(doubles.publish).not.toHaveBeenCalled();
  });

  it("lets an admin activate for any group", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState({ managedGroupIds: [] }));

    const ids: string[] = await execute(doubles, { actor: ADMIN });

    expect(ids).toHaveLength(2);
    expect(doubles.canManageGroup).not.toHaveBeenCalled();
  });

  it("rejects an unknown evaluation", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState({ evaluations: [] }));

    await expect(execute(doubles, { actor: OWNER })).rejects.toBeInstanceOf(EvaluationNotFoundError);
  });

  it("rejects an evaluation that is not READY", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState({ evaluations: [buildEvaluation()] }));

    await expect(execute(doubles)).rejects.toBeInstanceOf(EvaluationNotActivatableError);
    expect(doubles.save).not.toHaveBeenCalled();
  });

  it.each([
    ["a teacher group", studentGroup("group-2", { type: "TEACHER" })],
    ["an inactive group", studentGroup("group-2", { isActive: false })],
  ])("rejects %s as target", async (_label: string, group: ReturnType<typeof studentGroup>) => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState({ groups: [studentGroup("group-1"), group] }));

    await expect(execute(doubles)).rejects.toBeInstanceOf(InvalidEvaluationAssignmentGroupError);
    expect(doubles.save).not.toHaveBeenCalled();
  });

  it("rejects a missing group for an admin", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState({ groups: [studentGroup("group-1")] }));

    await expect(execute(doubles, { actor: ADMIN })).rejects.toBeInstanceOf(InvalidEvaluationAssignmentGroupError);
  });

  it("rejects an invalid window", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(readyState());

    await expect(execute(doubles, { startsAt: fromNow(3), endsAt: fromNow(1) })).rejects.toBeInstanceOf(InvalidEvaluationAssignmentWindowError);
  });

  it("rejects an overlapping assignment of the same group", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(
      readyState({ assignments: [buildAssignment({ groupId: "group-2", startsAt: fromNow(2), endsAt: fromNow(10) })] }),
    );

    await expect(execute(doubles)).rejects.toBeInstanceOf(EvaluationAlreadyAssignedError);
    expect(doubles.save).not.toHaveBeenCalled();
  });

  it("allows a new window after a closed assignment of the same group", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles(
      readyState({ assignments: [buildAssignment({ groupId: "group-1", startsAt: fromNow(-10), endsAt: fromNow(-5) })] }),
    );

    const ids: string[] = await execute(doubles);

    expect(ids).toHaveLength(2);
  });
});

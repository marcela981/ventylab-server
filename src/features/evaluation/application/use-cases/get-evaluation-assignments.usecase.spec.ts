/*
 * Funcionalidad: Pruebas de las consultas de asignaciones de evaluación
 * Descripción: Verifica el alcance de lectura (ADMIN todo, TEACHER grupos que creó o supervisa), el 403 al filtrar por un grupo no gestionado, el estado derivado en los resultados y la consulta interna de asignaciones visibles para un estudiante según su grupo STUDENT activo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import {
  type AssignmentsDoubles,
  buildAssignmentDoubles,
  buildView,
  fromNow,
} from "@/features/evaluation/application/testing/evaluation-assignment-test-doubles-spec";
import { ADMIN, buildEvaluation, OTHER_TEACHER } from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { GetEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-evaluation-assignments.usecase";
import { GetManagedEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-managed-evaluation-assignments.usecase";
import { GetStudentEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-student-evaluation-assignments.usecase";
import { EvaluationAssignmentForbiddenError, EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";

describe("GetEvaluationAssignmentsUseCase", () => {
  it("lists the assignments of an evaluation within the teacher scope with derived state", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles({
      evaluations: [buildEvaluation({ ready: true })],
      supervisedGroupIds: ["group-9"],
      views: [buildView(), buildView({ id: "assignment-2", startsAt: fromNow(2), endsAt: fromNow(4) })],
    });

    const result: EvaluationAssignmentResult[] = await new GetEvaluationAssignmentsUseCase(
      doubles.evaluationsRepository,
      doubles.assignmentsRepository,
      doubles.access,
    ).execute("evaluation-1", OTHER_TEACHER);

    expect(result.map((item: EvaluationAssignmentResult) => item.state)).toEqual(["ACTIVE", "UPCOMING"]);
    expect(doubles.getViewsByEvaluation).toHaveBeenCalledWith("evaluation-1", { teacherId: OTHER_TEACHER.id, supervisedGroupIds: ["group-9"] });
  });

  it("does not restrict the scope of an admin", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles({ evaluations: [buildEvaluation({ ready: true })] });

    await new GetEvaluationAssignmentsUseCase(doubles.evaluationsRepository, doubles.assignmentsRepository, doubles.access).execute("evaluation-1", ADMIN);

    expect(doubles.getViewsByEvaluation).toHaveBeenCalledWith("evaluation-1", undefined);
  });

  it("rejects an unknown evaluation", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles();

    await expect(
      new GetEvaluationAssignmentsUseCase(doubles.evaluationsRepository, doubles.assignmentsRepository, doubles.access).execute("evaluation-1", ADMIN),
    ).rejects.toBeInstanceOf(EvaluationNotFoundError);
  });
});

describe("GetManagedEvaluationAssignmentsUseCase", () => {
  it("forbids filtering by a group the teacher does not manage", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles({ managedGroupIds: [] });

    await expect(
      new GetManagedEvaluationAssignmentsUseCase(doubles.assignmentsRepository, doubles.access).execute({ page: 1, limit: 10, groupId: "group-1" }, OTHER_TEACHER),
    ).rejects.toBeInstanceOf(EvaluationAssignmentForbiddenError);
  });

  it("passes the state filter, the clock and the teacher scope to the repository", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles({ managedGroupIds: ["group-1"], views: [buildView()] });

    const result: Paginated<EvaluationAssignmentResult> = await new GetManagedEvaluationAssignmentsUseCase(doubles.assignmentsRepository, doubles.access).execute(
      { page: 1, limit: 10, groupId: "group-1", state: "ACTIVE" },
      OTHER_TEACHER,
    );

    expect(result.data[0].state).toBe("ACTIVE");
    expect(doubles.getViews).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: "group-1", state: "ACTIVE", now: expect.any(Date), scope: { teacherId: OTHER_TEACHER.id, supervisedGroupIds: [] } }),
    );
  });
});

describe("GetStudentEvaluationAssignmentsUseCase", () => {
  it("lists the assignments of the student's active STUDENT group", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles({ studentGroupId: "group-1", views: [buildView({ startsAt: fromNow(-5), endsAt: fromNow(-1) })] });

    const result: EvaluationAssignmentResult[] = await new GetStudentEvaluationAssignmentsUseCase(doubles.assignmentsRepository, doubles.access).execute("student-1");

    expect(doubles.getStudentGroupViews).toHaveBeenCalledWith("group-1");
    expect(result[0].state).toBe("CLOSED");
  });

  it("returns nothing for a student without a group", async () => {
    const doubles: AssignmentsDoubles = buildAssignmentDoubles();

    const result: EvaluationAssignmentResult[] = await new GetStudentEvaluationAssignmentsUseCase(doubles.assignmentsRepository, doubles.access).execute("student-1");

    expect(result).toEqual([]);
    expect(doubles.getStudentGroupViews).not.toHaveBeenCalled();
  });
});

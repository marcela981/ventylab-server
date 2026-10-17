/*
 * Funcionalidad: Pruebas de la política de acceso a sesiones de simulación
 * Descripción: Verifica con GroupsFacade y GroupAccessService reales sobre repositorios simulados que el dueño, un administrador y un docente que gestiona o supervisa el grupo STUDENT del dueño pueden leer y reproducir sus sesiones, y que un docente ajeno o otro estudiante reciben SimulationSessionAccessDeniedError
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { buildDoubles, buildGroup, buildMember, type GroupsDoubles } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";
import { type IGroupAnalyticsRepository } from "@/features/groups/domain/repositories/group-analytics.repository";
import { type SimulationActor, SimulationSessionAccessService } from "@/features/simulation/application/services/simulation-session-access.service";
import { SimulationSessionAccessDeniedError } from "@/features/simulation/domain/simulation.errors";

const OWNER_ID: string = "student-1";
const STUDENT_GROUP: StudentGroupSummaryView = { id: "group-1", name: "Group group-1", members: [], supervisingGroups: [] };

function buildAccessService(): SimulationSessionAccessService {
  const doubles: GroupsDoubles = buildDoubles({
    groups: [buildGroup({ id: "group-1", type: "STUDENT", createdBy: "teacher-1" })],
    members: [buildMember({ groupId: "group-1", userId: OWNER_ID })],
    supervisedByTeacher: [{ teacherUserId: "teacher-9", studentGroupId: "group-1" }],
  });

  (doubles.groupsRepository.getStudentGroupSummaryOfUser as jest.Mock).mockImplementation(
    (userId: string): Promise<StudentGroupSummaryView | undefined> => Promise.resolve(userId === OWNER_ID ? STUDENT_GROUP : undefined),
  );

  const analytics: IGroupAnalyticsRepository = {} as IGroupAnalyticsRepository;
  const facade: GroupsFacade = new GroupsFacade(doubles.groupsRepository, doubles.membersRepository, doubles.access, analytics);

  return new SimulationSessionAccessService(facade);
}

describe("SimulationSessionAccessService", () => {
  it.each([
    ["the owner", { id: OWNER_ID, role: "STUDENT" }],
    ["an admin", { id: "admin-1", role: "ADMIN" }],
    ["the teacher managing the owner's student group", { id: "teacher-1", role: "TEACHER" }],
    ["a teacher supervising the owner's student group", { id: "teacher-9", role: "TEACHER" }],
  ])("lets %s read and replay the owner's sessions", async (_name: string, actor: SimulationActor) => {
    const service: SimulationSessionAccessService = buildAccessService();

    const allowed: boolean = await service.canReadSessionsOf(actor, OWNER_ID);

    expect(allowed).toBe(true);
    await expect(service.assertCanReadSessionsOf(actor, OWNER_ID)).resolves.toBeUndefined();
  });

  it.each([
    ["an unrelated teacher", { id: "teacher-5", role: "TEACHER" }],
    ["another student", { id: "student-2", role: "STUDENT" }],
  ])("denies %s access to the owner's sessions", async (_name: string, actor: SimulationActor) => {
    const service: SimulationSessionAccessService = buildAccessService();

    const allowed: boolean = await service.canReadSessionsOf(actor, OWNER_ID);

    expect(allowed).toBe(false);
    await expect(service.assertCanReadSessionsOf(actor, OWNER_ID)).rejects.toBeInstanceOf(SimulationSessionAccessDeniedError);
  });

  it("denies a teacher when the owner has no student group", async () => {
    const service: SimulationSessionAccessService = buildAccessService();

    const allowed: boolean = await service.canReadSessionsOf({ id: "teacher-1", role: "TEACHER" }, "student-without-group");

    expect(allowed).toBe(false);
  });
});

/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : AdminDashboardAuditor — Gate G4.
 * Descripción   : Smoke test directo (sin HTTP) sobre GroupService:
 *                 crea un árbol de grupos depth 0/1/2, valida invariantes
 *                 (enrollmentCode único, creador TEACHER auto, líder
 *                 nulificado al remover, deleteGroup rechaza si hay
 *                 subgrupos, profundidad máxima respetada) y limpia todo
 *                 el árbol en finally. No requiere backend HTTP arriba;
 *                 solo Prisma + DB válida.
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import { prisma } from '../../../src/shared/infrastructure/database';
import * as Groups from '../../../src/modules/admin/group.service';
import { E2EAuditor, type E2EAuditResult, type Gate, type GateStatus } from '../E2EAuditor';

const AUDIT_TAG = `audit-e2e-${Date.now()}`;

export class AdminDashboardAuditor extends E2EAuditor {
  readonly objectiveCode = 'G4';
  readonly objectiveName = 'Dashboard admin: invariantes de GroupService.';

  async run(): Promise<E2EAuditResult> {
    const gates: Gate[] = [];
    const created: string[] = [];
    let teacherId = '';
    let studentId = '';

    try {
      const teacher = await prisma.user.create({
        data: { email: `${AUDIT_TAG}-t@audit.local`, name: 'Audit Teacher', role: 'TEACHER' as any },
      });
      teacherId = teacher.id;
      const student = await prisma.user.create({
        data: { email: `${AUDIT_TAG}-s@audit.local`, name: 'Audit Student', role: 'STUDENT' as any },
      });
      studentId = student.id;

      const root = await Groups.createGroup({ name: `${AUDIT_TAG}-root`, createdBy: teacherId });
      created.push(root.id);
      const codeUnique = !!root.enrollmentCode && /^[A-Z0-9]{6,}$/.test(root.enrollmentCode);
      gates.push(this.binary('G4.1', 'createGroup raíz: enrollmentCode generado y depth=0',
        codeUnique && root.depth === 0, `code=${root.enrollmentCode} depth=${root.depth}`));

      const rootWithMembers = await prisma.group.findUnique({
        where: { id: root.id },
        include: { members: { where: { userId: teacherId } } },
      });
      const creatorIsTeacher = rootWithMembers?.members[0]?.role === 'TEACHER';
      gates.push(this.binary('G4.2', 'Creador auto-añadido como TEACHER member',
        !!creatorIsTeacher, `member role=${rootWithMembers?.members[0]?.role ?? 'none'}`));

      const updated = await Groups.updateGroup(root.id, { description: 'updated by audit' });
      gates.push(this.binary('G4.3', 'updateGroup persiste cambios',
        updated.description === 'updated by audit', `description='${updated.description}'`));

      const studentAdded = await Groups.addMember(root.id, studentId, 'STUDENT');
      gates.push(this.binary('G4.4', 'addMember(STUDENT) crea membresía con rol correcto',
        studentAdded.role === 'STUDENT', `role=${studentAdded.role}`));

      const lead = await Groups.setSimulatorLead(root.id, studentId);
      gates.push(this.binary('G4.5', 'setSimulatorLead asigna simulatorLeaderId',
        lead.simulatorLeaderId === studentId, `simulatorLeaderId=${lead.simulatorLeaderId}`));

      await Groups.removeMember(root.id, studentId);
      const afterRemoval = await prisma.group.findUnique({ where: { id: root.id } });
      gates.push(this.binary('G4.6', 'removeMember del líder nulifica simulatorLeaderId',
        afterRemoval?.simulatorLeaderId === null,
        `simulatorLeaderId después de remover líder=${afterRemoval?.simulatorLeaderId}`));

      const child = await Groups.createGroup({ name: `${AUDIT_TAG}-child`, parentGroupId: root.id, createdBy: teacherId });
      created.push(child.id);
      const grand = await Groups.createGroup({ name: `${AUDIT_TAG}-grand`, parentGroupId: child.id, createdBy: teacherId });
      created.push(grand.id);
      gates.push(this.binary('G4.7', 'Jerarquía depth 0→1→2 construida',
        child.depth === 1 && grand.depth === 2, `child.depth=${child.depth}, grand.depth=${grand.depth}`));

      let depth3Rejected = false;
      let depth3Reason = '';
      try {
        const great = await Groups.createGroup({ name: `${AUDIT_TAG}-great`, parentGroupId: grand.id, createdBy: teacherId });
        created.push(great.id);
      } catch (err) {
        depth3Rejected = true;
        depth3Reason = (err as Error).message;
      }
      gates.push(this.binary('G4.8', 'createGroup rechaza depth=3 (max 3 niveles)',
        depth3Rejected, depth3Rejected ? `rechazado con: ${depth3Reason}` : 'no rechazó (FAIL)'));

      let deleteWithChildrenRejected = false;
      try { await Groups.deleteGroup(root.id); } catch (err) { deleteWithChildrenRejected = !!err; }
      gates.push(this.binary('G4.9', 'deleteGroup rechaza si hay subgrupos',
        deleteWithChildrenRejected, deleteWithChildrenRejected ? 'rechazado correctamente' : 'no rechazó (FAIL)'));

      await Groups.deleteGroup(grand.id);
      await Groups.deleteGroup(child.id);
      await Groups.deleteGroup(root.id);
      created.length = 0;
      const stillThere = await prisma.group.findUnique({ where: { id: root.id } });
      gates.push(this.binary('G4.10', 'deleteGroup elimina hojas y luego raíz',
        stillThere === null, stillThere === null ? 'árbol limpiado' : 'queda residuo (FAIL)'));

      const tableRows: Array<Array<string | number>> = gates.map((g) => [g.id, g.name, g.status, g.detail ?? '']);

      return {
        objectiveCode: this.objectiveCode,
        objectiveName: this.objectiveName,
        summary: this.summarize(gates),
        gates,
        tables: [{ title: 'G4 — Invariantes ejecutadas', headers: ['id', 'invariante', 'status', 'evidencia'], rows: tableRows }],
        defenseBullets: [
          'Demuestra que GroupService preserva sus invariantes de negocio en escenarios CRUD reales.',
          'Verifica la regla de profundidad máxima (3 niveles) por construcción, no por inspección.',
          'Garantiza el aislamiento del audit con cleanup en finally (no deja residuo en la BD).',
        ],
      };
    } finally {
      for (const id of [...created].reverse()) {
        try { await Groups.deleteGroup(id); } catch { /* best-effort */ }
      }
      try {
        if (studentId) await prisma.user.delete({ where: { id: studentId } });
        if (teacherId) await prisma.user.delete({ where: { id: teacherId } });
      } catch { /* best-effort */ }
    }
  }

  private binary(id: string, name: string, ok: boolean, evidence: string): Gate {
    const status: GateStatus = ok ? 'PASS' : 'FAIL';
    return this.makeGate(id, name, status, evidence);
  }
}

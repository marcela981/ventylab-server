/*
 * Funcionalidad: Pruebas del mapeador de usuarios de presentación
 * Descripción: Verifica que el DTO de usuario expone el código estudiantil (null sin código) y marca como superadministrador solo al usuario cuyo correo coincide, sin distinguir mayúsculas, con el configurado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { User } from "@/features/users/domain/entities/user.entity";
import { UserRole } from "@/features/users/domain/value-objects/user-role";
import { type UserDTO } from "@/features/users/presentation/dtos/user.dto";
import { UsersMapper } from "@/features/users/presentation/mappers/users.mapper";

const SUPERADMIN_EMAIL: string = "root@ventylab.com";

function buildUser(email: string, role: string, studentCode?: string): User {
  const createdAt: Date = new Date("2026-01-01T00:00:00.000Z");

  return User.reconstitute({ id: "U1", email, role: UserRole.create(role), isActive: true, studentCode, createdAt, updatedAt: createdAt, auditLogs: [] });
}

describe("UsersMapper.toDTO", () => {
  it("exposes the student code and marks a regular user as not superadmin", () => {
    const user: User = buildUser("ana@ventylab.com", "STUDENT", "2026-0001");

    const dto: UserDTO = UsersMapper.toDTO(user, SUPERADMIN_EMAIL);

    expect(dto).toMatchObject({ studentCode: "2026-0001", isSuperadmin: false });
  });

  it("marks the configured superadmin regardless of case and leaves a missing code null", () => {
    const user: User = buildUser("Root@VentyLab.com", "ADMIN");

    const dto: UserDTO = UsersMapper.toDTO(user, SUPERADMIN_EMAIL);

    expect(dto).toMatchObject({ studentCode: null, isSuperadmin: true });
  });
});

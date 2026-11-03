/*
 * Funcionalidad: Pruebas del mapeador de usuarios de presentación
 * Descripción: Verifica que el DTO de usuario expone el código estudiantil (null sin código) y marca como superadministrador solo al usuario cuyo correo coincide, sin distinguir mayúsculas, con el configurado; y que el DTO de estudiante usa la imagen resuelta (foto subida) y, sin ella, la imagen guardada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { StudentResult } from "@/features/users/application/results/student.result";
import { User } from "@/features/users/domain/entities/user.entity";
import { UserRole } from "@/features/users/domain/value-objects/user-role";
import { StudentProgressSummary } from "@/features/users/domain/value-objects/user-stats";
import { type StudentDTO } from "@/features/users/presentation/dtos/student.dto";
import { type UserDTO } from "@/features/users/presentation/dtos/user.dto";
import { UsersMapper } from "@/features/users/presentation/mappers/users.mapper";

const SUPERADMIN_EMAIL: string = "root@ventylab.com";

const GOOGLE_PICTURE: string = "https://lh3.googleusercontent.com/a/test-picture";
const SIGNED_PHOTO_URL: string = "https://storage.example.com/avatars/U1.png?token=signed";

function buildUser(email: string, role: string, studentCode?: string, image?: string): User {
  const createdAt: Date = new Date("2026-01-01T00:00:00.000Z");

  return User.reconstitute({ id: "U1", email, role: UserRole.create(role), isActive: true, studentCode, image, createdAt, updatedAt: createdAt, auditLogs: [] });
}

function buildStudent(image?: string): StudentResult {
  return new StudentResult({ user: buildUser("ana@ventylab.com", "STUDENT", "2026-0001", image), progress: StudentProgressSummary.empty("U1"), groups: [] });
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

describe("UsersMapper.toStudentDTO", () => {
  it("shows the resolved uploaded photo instead of the stored image", () => {
    const dto: StudentDTO = UsersMapper.toStudentDTO(buildStudent(GOOGLE_PICTURE), SIGNED_PHOTO_URL);

    expect(dto.image).toBe(SIGNED_PHOTO_URL);
  });

  it("falls back to the stored image, or null without one, when no photo is resolved", () => {
    expect(UsersMapper.toStudentDTO(buildStudent(GOOGLE_PICTURE)).image).toBe(GOOGLE_PICTURE);
    expect(UsersMapper.toStudentDTO(buildStudent(), undefined).image).toBeNull();
  });
});

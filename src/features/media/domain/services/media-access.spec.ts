/*
 * Funcionalidad: Pruebas de las reglas de acceso a media
 * Descripción: Verifica quién obtiene la URL firmada (personal docente siempre, estudiantes solo con contenido publicado) y quién gestiona cualquier archivo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { canManageAllMedia, canReadMediaURL, type MediaRequester } from "@/features/media/domain/services/media-access";

const STUDENT: MediaRequester = { userId: "student-1", role: "STUDENT", permissions: ["pages:read"] };
const TEACHER: MediaRequester = { userId: "teacher-1", role: "TEACHER", permissions: ["media:create", "media:read", "media:delete"] };
const ADMIN: MediaRequester = { userId: "admin-1", role: "ADMIN", permissions: ["media:create", "media:read", "media:delete"] };
const ADMIN_WITHOUT_PERMISSIONS: MediaRequester = { userId: "admin-2", role: "ADMIN", permissions: [] };

describe("canReadMediaURL", () => {
  it.each([TEACHER, ADMIN, ADMIN_WITHOUT_PERMISSIONS])("grants staff access without checking published content (%p)", async (requester: MediaRequester) => {
    const isPublished: jest.Mock<Promise<boolean>, []> = jest.fn<Promise<boolean>, []>().mockResolvedValue(false);

    const allowed: boolean = await canReadMediaURL(requester, isPublished);

    expect(allowed).toBe(true);
    expect(isPublished).not.toHaveBeenCalled();
  });

  it("grants a student access when published content uses the media", async () => {
    const isPublished: jest.Mock<Promise<boolean>, []> = jest.fn<Promise<boolean>, []>().mockResolvedValue(true);

    const allowed: boolean = await canReadMediaURL(STUDENT, isPublished);

    expect(allowed).toBe(true);
    expect(isPublished).toHaveBeenCalledTimes(1);
  });

  it("denies a student when no fully published content uses the media", async () => {
    const isPublished: jest.Mock<Promise<boolean>, []> = jest.fn<Promise<boolean>, []>().mockResolvedValue(false);

    const allowed: boolean = await canReadMediaURL(STUDENT, isPublished);

    expect(allowed).toBe(false);
  });
});

describe("canManageAllMedia", () => {
  it("lets admins manage any media but not teachers or students", () => {
    const decisions: boolean[] = [ADMIN, ADMIN_WITHOUT_PERMISSIONS, TEACHER, STUDENT].map((requester: MediaRequester) => canManageAllMedia(requester));

    expect(decisions).toEqual([true, true, false, false]);
  });
});

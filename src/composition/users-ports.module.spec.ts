/*
 * Funcionalidad: Pruebas de UsersPortsModule
 * Descripción: Verifica que el puerto de alcance docente de la feature de usuarios se enlaza a GroupsFacade.canViewStudent con el actor y el estudiante recibidos, y el almacenamiento de la foto de perfil a MediaFacade
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type FactoryProvider } from "@nestjs/common";

import { AVATAR_STORAGE_PROVIDER, STUDENT_SCOPE_CHECKER_PROVIDER } from "@/composition/users-ports.module";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { MediaFacade } from "@/features/media/application/services/media.facade";
import { AVATAR_STORAGE_TOKEN, type AvatarFile, type IAvatarStorage } from "@/features/users/application/ports/avatar-storage.interface";
import { type IStudentScopeChecker, STUDENT_SCOPE_CHECKER_TOKEN } from "@/features/users/application/ports/student-scope-checker.interface";

describe("UsersPortsModule", () => {
  it("binds the student scope checker to GroupsFacade.canViewStudent", async () => {
    const provider: FactoryProvider<IStudentScopeChecker> = STUDENT_SCOPE_CHECKER_PROVIDER as FactoryProvider<IStudentScopeChecker>;
    const facade: { canViewStudent: jest.Mock } = { canViewStudent: jest.fn().mockResolvedValue(true) };

    const checker: IStudentScopeChecker = provider.useFactory(facade) as IStudentScopeChecker;

    expect(provider.provide).toBe(STUDENT_SCOPE_CHECKER_TOKEN);
    expect(provider.inject).toEqual([GroupsFacade]);
    expect(await checker.canViewStudent({ id: "teacher-1", role: "TEACHER" }, "student-1")).toBe(true);
    expect(facade.canViewStudent).toHaveBeenCalledWith({ id: "teacher-1", role: "TEACHER" }, "student-1");
  });

  it("binds the avatar storage to MediaFacade", async () => {
    const provider: FactoryProvider<IAvatarStorage> = AVATAR_STORAGE_PROVIDER as FactoryProvider<IAvatarStorage>;
    const facade: { uploadAvatar: jest.Mock; deleteAvatar: jest.Mock } = { uploadAvatar: jest.fn().mockResolvedValue("media-1"), deleteAvatar: jest.fn().mockResolvedValue(undefined) };
    const file: AvatarFile = { ownerId: "U1", content: Buffer.from("x"), mimeType: "image/png", sizeBytes: 1, originalName: "me.png" };

    const storage: IAvatarStorage = provider.useFactory(facade) as IAvatarStorage;

    expect(provider.provide).toBe(AVATAR_STORAGE_TOKEN);
    expect(provider.inject).toEqual([MediaFacade]);
    expect(await storage.store(file)).toBe("media-1");
    await storage.remove("media-1", "U1");
    expect(facade.uploadAvatar).toHaveBeenCalledWith(file);
    expect(facade.deleteAvatar).toHaveBeenCalledWith("media-1", "U1");
  });
});

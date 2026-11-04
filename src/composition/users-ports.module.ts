/*
 * Funcionalidad: Módulo UsersPortsModule
 * Descripción: Parte global de la raíz de composición que enlaza los puertos de la feature de usuarios: STUDENT_SCOPE_CHECKER_TOKEN a GroupsFacade.canViewStudent, STUDENT_GROUPS_READER_TOKEN a GroupsFacade.getActiveStudentGroupsOfUsers y AVATAR_STORAGE_TOKEN a MediaFacade (subida y borrado de la foto de perfil), de modo que UsersModule no importa GroupsModule ni MediaModule (que ya lo importan a él)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module, type Provider } from "@nestjs/common";

import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { GroupsModule } from "@/features/groups/groups.module";
import { MediaFacade } from "@/features/media/application/services/media.facade";
import { MediaModule } from "@/features/media/media.module";
import { AVATAR_STORAGE_TOKEN, type AvatarFile, type IAvatarStorage } from "@/features/users/application/ports/avatar-storage.interface";
import { type IStudentGroupsReader, STUDENT_GROUPS_READER_TOKEN, type StudentGroupRef } from "@/features/users/application/ports/student-groups-reader.interface";
import {
  type IStudentScopeChecker,
  STUDENT_SCOPE_CHECKER_TOKEN,
  type StudentScopeActor,
} from "@/features/users/application/ports/student-scope-checker.interface";

export const STUDENT_SCOPE_CHECKER_PROVIDER: Provider = {
  provide: STUDENT_SCOPE_CHECKER_TOKEN,
  inject: [GroupsFacade],
  useFactory: (groups: GroupsFacade): IStudentScopeChecker => ({
    canViewStudent: (actor: StudentScopeActor, studentId: string): Promise<boolean> => groups.canViewStudent(actor, studentId),
  }),
};

export const STUDENT_GROUPS_READER_PROVIDER: Provider = {
  provide: STUDENT_GROUPS_READER_TOKEN,
  inject: [GroupsFacade],
  useFactory: (groups: GroupsFacade): IStudentGroupsReader => ({
    getActiveGroups: (studentIds: ReadonlyArray<string>): Promise<ReadonlyMap<string, StudentGroupRef[]>> => groups.getActiveStudentGroupsOfUsers(studentIds),
  }),
};

export const AVATAR_STORAGE_PROVIDER: Provider = {
  provide: AVATAR_STORAGE_TOKEN,
  inject: [MediaFacade],
  useFactory: (media: MediaFacade): IAvatarStorage => ({
    store: (file: AvatarFile): Promise<string> => media.uploadAvatar(file),
    remove: (mediaId: string, ownerId: string): Promise<void> => media.deleteAvatar(mediaId, ownerId),
  }),
};

@Global()
@Module({
  imports: [GroupsModule, MediaModule],
  providers: [STUDENT_SCOPE_CHECKER_PROVIDER, STUDENT_GROUPS_READER_PROVIDER, AVATAR_STORAGE_PROVIDER],
  exports: [STUDENT_SCOPE_CHECKER_TOKEN, STUDENT_GROUPS_READER_TOKEN, AVATAR_STORAGE_TOKEN],
})
export class UsersPortsModule {}

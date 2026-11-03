/*
 * Funcionalidad: Servicio UserImageResolver
 * Descripción: Resuelve la imagen que muestra UserDTO: la URL firmada de la foto de perfil subida (puerto común IMediaUrlResolver, una sola lectura por lote) o, si no hay, la imagen guardada del usuario (la de Google o una URL anterior)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IMediaUrlResolver, MEDIA_URL_RESOLVER_TOKEN, type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { type User } from "@/features/users/domain/entities/user.entity";

@Injectable()
export class UserImageResolver {
  public constructor(
    @Inject(MEDIA_URL_RESOLVER_TOKEN)
    private readonly _mediaUrlResolver: IMediaUrlResolver,
  ) {}

  // userId -> image URL; users without an uploaded photo (or whose photo cannot be resolved) keep their stored image.
  public async resolve(users: readonly User[]): Promise<Map<string, string | undefined>> {
    const mediaIds: string[] = users.flatMap((user: User): string[] => (user.avatarMediaId ? [user.avatarMediaId] : []));
    const resolved: Map<string, ResolvedMediaURL> = mediaIds.length > 0 ? await this._mediaUrlResolver.resolveMany(mediaIds) : new Map<string, ResolvedMediaURL>();

    return new Map(users.map((user: User): [string, string | undefined] => [user.id, (user.avatarMediaId ? resolved.get(user.avatarMediaId)?.url : undefined) ?? user.image]));
  }

  public async resolveOne(user: User): Promise<string | undefined> {
    return (await this.resolve([user])).get(user.id);
  }
}

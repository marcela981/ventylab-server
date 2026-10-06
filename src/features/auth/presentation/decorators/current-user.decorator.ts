/*
 * Funcionalidad: Decorador CurrentUser
 * Descripción: Inyecta en el controlador el JwtPayload del usuario autenticado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { type Request } from "express";

import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";

export const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const request: Request = ctx.switchToHttp().getRequest<Request>();

    return request.user;
  },
);

/*
 * Funcionalidad: Regla de acceso a la documentación de la API
 * Descripción: Middleware de Express para /api/docs y /api/docs-json: fuera de producción la documentación está abierta; en producción solo responde a un token de acceso válido de rol ADMIN en la cabecera Authorization (verificado con el puerto IAccessTokenVerifier); SWAGGER_ALLOWED_IPS, si tiene IPs, restringe además la IP de origen en cualquier entorno. Cualquier rechazo responde 404 para no revelar que la ruta existe
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type NextFunction, type Request, type RequestHandler, type Response } from "express";

import { type AccessTokenClaims, type IAccessTokenVerifier } from "@/common/application/ports/access-token-verifier.interface";

export const DOCS_ADMIN_ROLE: string = "ADMIN";

const WILDCARD_IP: string = "*";

export interface DocsAccessOptions {
  readonly isProduction: boolean;
  readonly allowedIps?: string;
}

export function parseAllowedIps(raw: string | undefined): readonly string[] | undefined {
  const ips: string[] = (raw ?? "").split(",").map((ip: string): string => ip.trim()).filter((ip: string): boolean => ip.length > 0);

  return ips.length === 0 || ips.includes(WILDCARD_IP) ? undefined : ips;
}

function readBearerToken(request: Request): string | undefined {
  const header: string | undefined = request.headers.authorization;
  const match: RegExpExecArray | null = header === undefined ? null : /^Bearer\s+(\S+)$/i.exec(header);

  return match?.[1];
}

async function isAdmin(request: Request, verifier: IAccessTokenVerifier): Promise<boolean> {
  const token: string | undefined = readBearerToken(request);

  if (token === undefined) {
    return false;
  }

  try {
    const claims: AccessTokenClaims | undefined = await verifier.verify(token);

    return claims?.role === DOCS_ADMIN_ROLE;
  } catch {
    return false;
  }
}

export function createDocsAccessMiddleware(options: DocsAccessOptions, verifier: IAccessTokenVerifier): RequestHandler {
  const allowedIps: readonly string[] | undefined = parseAllowedIps(options.allowedIps);

  return (request: Request, response: Response, next: NextFunction): void => {
    const deny = (): void => {
      response.status(404).end();
    };

    if (allowedIps !== undefined && !allowedIps.includes(request.ip ?? "")) {
      deny();

      return;
    }

    if (!options.isProduction) {
      next();

      return;
    }

    isAdmin(request, verifier).then((admin: boolean): void => {
      if (admin) {
        next();
      } else {
        deny();
      }
    }, deny);
  };
}

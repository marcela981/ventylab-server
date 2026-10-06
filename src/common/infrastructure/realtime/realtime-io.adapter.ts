/*
 * Funcionalidad: Adaptador RealtimeIoAdapter
 * Descripción: Adaptador de Socket.io que aplica los mismos orígenes y cabeceras CORS que la API HTTP
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type INestApplicationContext } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { type Server, type ServerOptions } from "socket.io";

import { buildCorsOrigin, CORS_ALLOWED_HEADERS } from "@/common/infrastructure/config/cors-origins";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

export class RealtimeIoAdapter extends IoAdapter {
  public constructor(
    app: INestApplicationContext,
    private readonly _configService: ConfigService<EnvironmentVariables, true>,
  ) {
    super(app);
  }

  public override createIOServer(port: number, options?: ServerOptions): Server {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: buildCorsOrigin(this._configService),
        methods: ["GET", "POST"],
        allowedHeaders: [...CORS_ALLOWED_HEADERS],
        credentials: true,
      },
    }) as Server;
  }
}

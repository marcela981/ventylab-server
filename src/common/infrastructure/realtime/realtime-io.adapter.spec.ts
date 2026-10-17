/*
 * Funcionalidad: Pruebas del adaptador RealtimeIoAdapter
 * Descripción: Verifica que el servidor Socket.io se crea con los mismos orígenes permitidos que la API HTTP (lista CORS_ORIGIN y FRONTEND_URL), credenciales y las cabeceras CORS comunes
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

import { CORS_ALLOWED_HEADERS, type CorsOrigin } from "@/common/infrastructure/config/cors-origins";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { RealtimeIoAdapter } from "@/common/infrastructure/realtime/realtime-io.adapter";

interface SocketCors {
  readonly origin: CorsOrigin;
  readonly credentials: boolean;
  readonly allowedHeaders: string[];
  readonly methods: string[];
}

const CONFIG_VALUES: Partial<Record<keyof EnvironmentVariables, unknown>> = {
  CORS_ORIGIN: "https://app.vercel.app,http://localhost:3000",
  FRONTEND_URL: "https://frontend.example.com",
  PRODUCTION_URL: "",
  VERCEL_URL: undefined,
  CORS_ALLOW_VERCEL_PREVIEWS: false,
};

function config(): ConfigService<EnvironmentVariables, true> {
  return { get: (key: keyof EnvironmentVariables): unknown => CONFIG_VALUES[key] } as unknown as ConfigService<EnvironmentVariables, true>;
}

function isAllowed(origin: CorsOrigin, value: string): boolean | undefined {
  if (origin === "*") {
    return true;
  }

  let result: boolean | undefined;

  origin(value, (_error: Error | null, allow?: boolean): void => {
    result = allow;
  });

  return result;
}

describe("RealtimeIoAdapter", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates the Socket.io server with the HTTP CORS origins, credentials and headers", () => {
    const createIOServer: jest.SpyInstance = jest.spyOn(IoAdapter.prototype, "createIOServer").mockReturnValue({} as Server);
    const adapter: RealtimeIoAdapter = new RealtimeIoAdapter({} as INestApplicationContext, config());

    adapter.createIOServer(0, { path: "/socket.io" } as ServerOptions);

    const options: ServerOptions & { cors: SocketCors } = createIOServer.mock.calls[0][1] as ServerOptions & { cors: SocketCors };

    expect(options.path).toBe("/socket.io");
    expect(options.cors).toMatchObject({ credentials: true, methods: ["GET", "POST"], allowedHeaders: [...CORS_ALLOWED_HEADERS] });
    expect(isAllowed(options.cors.origin, "https://app.vercel.app")).toBe(true);
    expect(isAllowed(options.cors.origin, "https://frontend.example.com")).toBe(true);
    expect(isAllowed(options.cors.origin, "https://evil.example.com")).toBe(false);
  });
});

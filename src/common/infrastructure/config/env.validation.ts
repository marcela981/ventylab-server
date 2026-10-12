/*
 * Funcionalidad: Validación de variables de entorno
 * Descripción: Declara y valida con class-validator todas las variables de entorno al arrancar, falla con un mensaje que nombra cada variable inválida y resuelve MQTT_URL como alias de MQTT_BROKER_URL; incluye la nota mínima aprobatoria de evaluaciones (EVALUATION_PASSING_GRADE, 0–5, por defecto 3.0) y la configuración del gateway de IA (claves y URL base de OpenAI y Anthropic, proveedor HTTP personalizado, ajustes JSON por caso de uso, cuotas, precios, cortocircuito y tutor) y los ajustes de las sesiones de simulación con eventos (tolerancia del tiempo simulado, minutos para marcar abandono y tamaño máximo de lote de eventos) y las reglas de reservas del ventilador (duración máxima, granularidad de franja, días de antelación, máximo de reservas futuras por estudiante y por grupo, e identificador del dispositivo usado como clave del bloqueo) y de la telemetría del ventilador físico (conexión MQTT habilitada solo con MQTT_BROKER_URL, tópicos, retroceso de reconexión, decodificador, intervalos de envío, máximo de tramas en el búfer de lotes, inactividad, sala, métricas, grabación, ventana de reordenamiento y vuelta opcional de 16 o 32 bits de la secuencia) y de los comandos del ventilador (tópico de acuse opcional, prefijo de tópicos de pruebas, que debe empezar por letra o dígito, codificación, tiempo máximo de espera, frecuencia por usuario, gracia del operador, refresco del control, tolerancia de parámetros aplicados y límites de seguridad) y del estado del sistema (tiempo máximo por chequeo de salud, segundos de caché del estado, versión de la aplicación, que por defecto se lee de package.json, y commit opcional con GIT_COMMIT como alias de APP_COMMIT_SHA) y la sal opcional de la exportación anonimizada de analítica (ANALYTICS_EXPORT_SALT, mínimo 16 caracteres); expone además la lectura de la bandera opcional RUN_DB_INTEGRATION que habilita las pruebas de integración contra PostgreSQL
 * Versión: 1.13
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readFileSync } from "fs";
import { join } from "path";

import { Transform, Type, plainToInstance } from "class-transformer";
import { IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsJSON, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Matches, Max, Min, MinLength, type ValidationError, validateSync } from "class-validator";

export enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

// A test prefix such as "/" would map the test topics onto the real ones
export const MQTT_TEST_TOPIC_PREFIX_PATTERN: RegExp = /^[A-Za-z0-9][A-Za-z0-9_\-/]*$/;

const ToBoolean = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }): unknown => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;

    return value;
  });

export class EnvironmentVariables {
  @IsEnum(Environment)
  public NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Type(() => Number)
  public PORT: number = 4000;

  @IsString()
  public DATABASE_URL: string;

  @IsString()
  public DIRECT_URL: string;

  @IsString()
  public JWT_SECRET: string;

  @IsString()
  public JWT_EXPIRES_IN: string;

  @IsString()
  public JWT_REFRESH_SECRET: string;

  @IsString()
  public JWT_REFRESH_EXPIRES_IN: string;

  @IsString()
  public NEXTAUTH_SECRET: string;

  @IsString()
  public NEXTAUTH_BRIDGE_SECRET: string;

  @IsString()
  public ADMIN_API_KEY: string;

  @IsEmail()
  public SUPERADMIN_EMAIL: string;

  @IsString()
  @IsOptional()
  public GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  public GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  public ALLOWED_EMAIL_DOMAINS?: string;

  @IsString()
  public CORS_ORIGIN: string;

  @IsString()
  public FRONTEND_URL: string;

  @IsString()
  public PRODUCTION_URL: string;

  @IsString()
  @IsOptional()
  public VERCEL_URL?: string;

  @IsNumber()
  @Type(() => Number)
  public THROTTLE_TTL: number = 60000;

  @IsNumber()
  @Type(() => Number)
  public THROTTLE_LIMIT: number = 100;

  @IsString()
  @IsOptional()
  public SENTRY_DSN?: string;

  @IsString()
  @IsOptional()
  public SWAGGER_ALLOWED_IPS?: string;

  @IsString()
  public SMTP_HOST: string;

  @IsNumber()
  @Type(() => Number)
  public SMTP_PORT: number;

  @IsString()
  public SMTP_FROM: string;

  @IsString()
  @IsOptional()
  public SMTP_USER?: string;

  @IsString()
  @IsOptional()
  public SMTP_PASS?: string;

  @IsBoolean()
  @ToBoolean()
  public SMTP_SECURE: boolean = false;

  @IsString()
  @IsOptional()
  public MQTT_BROKER_URL?: string;

  @IsString()
  @IsOptional()
  public MQTT_URL?: string;

  @IsString()
  @IsOptional()
  public MQTT_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  public MQTT_USERNAME?: string;

  @IsString()
  @IsOptional()
  public MQTT_PASSWORD?: string;

  @IsString()
  @IsNotEmpty()
  public MQTT_TELEMETRY_TOPIC: string = "/ventynet/data";

  @IsString()
  @IsNotEmpty()
  public MQTT_COMMAND_TOPIC: string = "ventilab/device/001/command";

  @IsString()
  @IsNotEmpty()
  public MQTT_ALARM_TOPIC: string = "ventilab/device/001/alarm";

  @IsString()
  public MQTT_COMMAND_ACK_TOPIC: string = "";

  @IsString()
  @Matches(MQTT_TEST_TOPIC_PREFIX_PATTERN, { message: "MQTT_TEST_TOPIC_PREFIX must start with a letter or digit and contain only letters, digits, _, - and /" })
  public MQTT_TEST_TOPIC_PREFIX: string = "test/ventylab";

  @IsIn(["json", "hex"])
  public VENTILATOR_COMMAND_ENCODING: "json" | "hex" = "json";

  @IsInt()
  @Min(100)
  @Max(60000)
  @Type(() => Number)
  public VENTILATOR_COMMAND_TIMEOUT_MS: number = 3000;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.1)
  @Max(100)
  @Type(() => Number)
  public VENTILATOR_COMMAND_RATE_PER_SECOND: number = 5;

  @IsInt()
  @Min(0)
  @Max(600)
  @Type(() => Number)
  public VENTILATOR_OPERATOR_GRACE_SECONDS: number = 15;

  @IsInt()
  @Min(100)
  @Type(() => Number)
  public VENTILATOR_CONTROL_REFRESH_MS: number = 1000;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(1)
  @Type(() => Number)
  public VENTILATOR_APPLY_TOLERANCE_RATIO: number = 0.05;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Type(() => Number)
  public VENTILATOR_SAFETY_MAX_PEEP: number = 15;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Type(() => Number)
  public VENTILATOR_SAFETY_MAX_PRESSURE_LIMIT: number = 40;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Type(() => Number)
  public VENTILATOR_SAFETY_MAX_TIDAL_VOLUME: number = 700;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Type(() => Number)
  public VENTILATOR_SAFETY_MAX_RESPIRATORY_RATE: number = 35;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.1)
  @Max(4)
  @Type(() => Number)
  public VENTILATOR_SAFETY_MAX_IE_RATIO: number = 1;

  @IsInt()
  @Min(100)
  @Type(() => Number)
  public MQTT_RECONNECT_BASE_MS: number = 1000;

  @IsInt()
  @Min(1000)
  @Type(() => Number)
  public MQTT_RECONNECT_MAX_MS: number = 30000;

  @IsIn(["auto", "json", "hex"])
  public VENTILATOR_TELEMETRY_DECODER: "auto" | "json" | "hex" = "auto";

  @IsInt()
  @Min(5)
  @Max(1000)
  @Type(() => Number)
  public VENTILATOR_FLUSH_INTERVAL_MS: number = 33;

  @IsInt()
  @Min(1)
  @Max(100_000)
  @Type(() => Number)
  public VENTILATOR_MAX_BUFFERED_FRAMES: number = 256;

  @IsInt()
  @Min(250)
  @Type(() => Number)
  public VENTILATOR_STALE_AFTER_MS: number = 2000;

  @IsInt()
  @Min(100)
  @Type(() => Number)
  public VENTILATOR_ROOM_REFRESH_MS: number = 1000;

  @IsInt()
  @Min(10)
  @Max(1_000_000)
  @Type(() => Number)
  public VENTILATOR_METRICS_WINDOW: number = 10000;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  public VENTILATOR_INVALID_LOG_INTERVAL_MS: number = 5000;

  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  public VENTILATOR_RECORDING_HZ: number = 20;

  @IsInt()
  @Min(1)
  @Max(3600)
  @Type(() => Number)
  public VENTILATOR_RECORDING_FLUSH_SECONDS: number = 5;

  @IsInt()
  @Min(0)
  @Max(1024)
  @Type(() => Number)
  public VENTILATOR_SEQ_REORDER_WINDOW: number = 16;

  @IsIn([0, 16, 32])
  @Type(() => Number)
  public VENTILATOR_SEQ_WRAP_BITS: 0 | 16 | 32 = 0;

  @IsString()
  @IsOptional()
  public INFLUXDB_URL?: string;

  @IsString()
  @IsOptional()
  public INFLUXDB_TOKEN?: string;

  @IsString()
  @IsOptional()
  public INFLUXDB_ORG?: string;

  @IsString()
  @IsOptional()
  public INFLUXDB_BUCKET?: string;

  @IsString()
  @IsOptional()
  public GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  public OPENAI_API_KEY?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  public OPENAI_BASE_URL?: string;

  @IsString()
  @IsOptional()
  public ANTHROPIC_API_KEY?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  public ANTHROPIC_BASE_URL?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  public AI_CUSTOM_HTTP_ENDPOINT?: string;

  @IsString()
  @IsOptional()
  public AI_CUSTOM_HTTP_AUTH_HEADER?: string;

  @IsString()
  @IsOptional()
  public AI_CUSTOM_HTTP_AUTH_VALUE?: string;

  @IsJSON()
  @IsOptional()
  public AI_USE_CASE_SETTINGS?: string;

  @IsJSON()
  @IsOptional()
  public AI_QUOTAS?: string;

  @IsJSON()
  @IsOptional()
  public AI_PRICES?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public AI_BREAKER_FAILURE_THRESHOLD: number = 3;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public AI_BREAKER_OPEN_SECONDS: number = 60;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  public AI_TUTOR_HISTORY_WINDOW: number = 10;

  @IsInt()
  @Min(100)
  @Type(() => Number)
  public AI_TUTOR_CONTEXT_TOKEN_BUDGET: number = 6000;

  @IsString()
  @IsOptional()
  public SUPABASE_URL?: string;

  @IsString()
  @IsOptional()
  public SUPABASE_SERVICE_ROLE_KEY?: string;

  @IsString()
  @IsOptional()
  public SUPABASE_STORAGE_BUCKET?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public MEDIA_MAX_IMAGE_BYTES: number = 10 * 1024 * 1024;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public MEDIA_MAX_FILE_BYTES: number = 20 * 1024 * 1024;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public MEDIA_MAX_VIDEO_BYTES: number = 100 * 1024 * 1024;

  @IsInt()
  @Min(60)
  @Type(() => Number)
  public MEDIA_SIGNED_URL_TTL_SECONDS: number = 3600;

  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  public EVALUATION_PASSING_GRADE: number = 3.0;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  public SIMULATION_EVENT_TIME_TOLERANCE_MS: number = 5000;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public SIMULATION_ABANDON_AFTER_MINUTES: number = 30;

  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  public SIMULATION_MAX_EVENT_BATCH_SIZE: number = 200;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public RESERVATION_MAX_DURATION_MINUTES: number = 120;

  @IsInt()
  @Min(1)
  @Max(60)
  @Type(() => Number)
  public RESERVATION_SLOT_MINUTES: number = 15;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public RESERVATION_MAX_ADVANCE_DAYS: number = 14;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public RESERVATION_MAX_FUTURE_PER_STUDENT: number = 3;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  public RESERVATION_MAX_FUTURE_PER_GROUP: number = 5;

  @IsString()
  @IsNotEmpty()
  public VENTILATOR_DEVICE_ID: string = "ventilab-device-001";

  @IsInt()
  @Min(100)
  @Max(10_000)
  @Type(() => Number)
  public HEALTH_CHECK_TIMEOUT_MS: number = 2000;

  @IsInt()
  @Min(5)
  @Max(10)
  @Type(() => Number)
  public SYSTEM_STATUS_CACHE_SECONDS: number = 5;

  @IsString()
  @MinLength(16)
  @IsOptional()
  public ANALYTICS_EXPORT_SALT?: string;

  @IsString()
  @IsOptional()
  public APP_VERSION?: string;

  @IsString()
  @IsOptional()
  public APP_COMMIT_SHA?: string;

  @IsString()
  @IsOptional()
  public GIT_COMMIT?: string;
}

function readPackageVersion(): string | undefined {
  try {
    const manifest: unknown = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));

    if (typeof manifest === "object" && manifest !== null && typeof (manifest as { version?: unknown }).version === "string") {
      return (manifest as { version: string }).version;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function formatValidationErrors(errors: ValidationError[]): string {
  const lines: string[] = errors.map((error: ValidationError) => {
    const constraints: string[] = Object.values(error.constraints ?? {});

    return `  - ${error.property}: ${constraints.join("; ")}`;
  });

  return ["Invalid environment configuration:", ...lines].join("\n");
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig: EnvironmentVariables = plainToInstance(
    EnvironmentVariables,
    config,
  );

  const errors: ValidationError[] = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(formatValidationErrors(errors));
  }

  validatedConfig.MQTT_BROKER_URL = validatedConfig.MQTT_BROKER_URL ?? validatedConfig.MQTT_URL;
  validatedConfig.APP_COMMIT_SHA = validatedConfig.APP_COMMIT_SHA ?? validatedConfig.GIT_COMMIT;
  validatedConfig.APP_VERSION = validatedConfig.APP_VERSION ?? readPackageVersion();

  return validatedConfig;
}

export interface DbIntegrationSettings {
  enabled: boolean;
  databaseUrl?: string;
}

export function readDbIntegrationSettings(): DbIntegrationSettings {
  return { enabled: process.env.RUN_DB_INTEGRATION === "1", databaseUrl: process.env.DATABASE_URL };
}

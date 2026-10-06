/*
 * Funcionalidad: Validación de variables de entorno
 * Descripción: Declara y valida con class-validator todas las variables de entorno al arrancar, falla con un mensaje que nombra cada variable inválida y resuelve MQTT_URL como alias de MQTT_BROKER_URL; incluye la nota mínima aprobatoria de evaluaciones (EVALUATION_PASSING_GRADE, 0–5, por defecto 3.0) y la configuración del gateway de IA (claves y URL base de OpenAI y Anthropic, proveedor HTTP personalizado, ajustes JSON por caso de uso, cuotas, precios, cortocircuito y tutor)
 * Versión: 1.5
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Transform, Type, plainToInstance } from "class-transformer";
import { IsBoolean, IsEmail, IsEnum, IsInt, IsJSON, IsNumber, IsOptional, IsString, IsUrl, Max, Min, type ValidationError, validateSync } from "class-validator";

export enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}

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
  @IsOptional()
  public MQTT_TELEMETRY_TOPIC?: string;

  @IsString()
  @IsOptional()
  public MQTT_COMMAND_TOPIC?: string;

  @IsString()
  @IsOptional()
  public MQTT_ALARM_TOPIC?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public WS_MAX_HZ?: number;

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

  return validatedConfig;
}

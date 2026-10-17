/*
 * Funcionalidad: Motivos de rechazo de un valor de ajuste
 * Descripción: Catálogo de códigos de motivo por los que el registro rechaza un valor de ajuste (tipo, rango, longitud, campos, repeticiones, valores permitidos u obligatorios y proveedores sin credenciales) con sus argumentos, su clave de traducción y su texto en inglés usado en el mensaje del error de dominio, y el detalle por campo con la ruta del ajuste (la clave del ajuste para el valor completo o la clave seguida de la ruta anidada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type PlatformSettingReasonCode =
  | "not_a_number"
  | "not_an_integer"
  | "out_of_range"
  | "not_a_boolean"
  | "empty_string"
  | "too_long"
  | "not_an_object"
  | "unknown_field"
  | "not_an_array"
  | "entries_out_of_range"
  | "repeated_provider"
  | "missing_models"
  | "not_allowed_value"
  | "missing_required_value"
  | "repeated_multiplier"
  | "provider_not_configured";

export type PlatformSettingReasonArgs = Readonly<Record<string, string | number>>;

export interface PlatformSettingFieldError {
  readonly field: string;
  readonly code: string;
  readonly args: PlatformSettingReasonArgs;
  readonly message: string;
}

const VALUE_ROOT: string = "value";

const REASON_TEXTS: Readonly<Record<PlatformSettingReasonCode, (args: PlatformSettingReasonArgs) => string>> = {
  not_a_number: (): string => "must be a number",
  not_an_integer: (): string => "must be an integer",
  out_of_range: (args: PlatformSettingReasonArgs): string => `must be between ${args.min} and ${args.max}`,
  not_a_boolean: (): string => "must be a boolean",
  empty_string: (): string => "must be a non-empty string",
  too_long: (args: PlatformSettingReasonArgs): string => `must have at most ${args.max} characters`,
  not_an_object: (): string => "must be an object",
  unknown_field: (): string => "is not a known field",
  not_an_array: (): string => "must be an array",
  entries_out_of_range: (args: PlatformSettingReasonArgs): string => `must have between ${args.min} and ${args.max} entries`,
  repeated_provider: (): string => "must not repeat a provider",
  missing_models: (args: PlatformSettingReasonArgs): string => `needs a model for ${args.providers}`,
  not_allowed_value: (args: PlatformSettingReasonArgs): string => `must be one of ${args.allowed}`,
  missing_required_value: (args: PlatformSettingReasonArgs): string => `must include ${args.required}`,
  repeated_multiplier: (): string => "must not repeat a multiplier",
  provider_not_configured: (args: PlatformSettingReasonArgs): string => `has AI providers without credentials: ${args.providers}`,
};

export function describePlatformSettingReason(code: PlatformSettingReasonCode, args: PlatformSettingReasonArgs): string {
  return REASON_TEXTS[code](args);
}

export function platformSettingField(key: string, path: string): string {
  const relative: string = path === VALUE_ROOT ? "" : path.startsWith(`${VALUE_ROOT}.`) || path.startsWith(`${VALUE_ROOT}[`) ? path.slice(VALUE_ROOT.length) : `.${path}`;

  return `${key}${relative}`;
}

export function buildPlatformSettingFieldError(key: string, path: string, code: PlatformSettingReasonCode, args: PlatformSettingReasonArgs): PlatformSettingFieldError {
  return { field: platformSettingField(key, path), code: `platform-settings.reasons.${code}`, args, message: describePlatformSettingReason(code, args) };
}

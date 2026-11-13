/*
 * Funcionalidad: Pruebas de la validación de variables de entorno
 * Descripción: Verifica que MQTT_TELEMETRY_TOPIC y MQTT_ALARM_TOPIC rechacen los comodines MQTT (+ y #) al arrancar, con un mensaje que nombra la variable, y que sus valores por defecto sean válidos. v1.0 (2026-11-11, review R1 round 3 follow-up M3)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { plainToInstance } from "class-transformer";
import { type ValidationError, validateSync } from "class-validator";

import { EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

type TopicVariable = "MQTT_TELEMETRY_TOPIC" | "MQTT_ALARM_TOPIC";

function topicErrors(variable: TopicVariable, config: Record<string, unknown>): ValidationError[] {
  return validateSync(plainToInstance(EnvironmentVariables, config)).filter(
    (error: ValidationError): boolean => error.property === variable,
  );
}

describe("environment validation of the MQTT telemetry topics", () => {
  it.each([
    ["MQTT_TELEMETRY_TOPIC", "ventynet/+/data"],
    ["MQTT_TELEMETRY_TOPIC", "ventynet/#"],
    ["MQTT_ALARM_TOPIC", "ventilab/device/+/alarm"],
    ["MQTT_ALARM_TOPIC", "ventilab/#"],
  ])("rejects %s=%p, a wildcard the exact-topic pipeline would never match", (variable: string, topic: string) => {
    const errors: ValidationError[] = topicErrors(variable as TopicVariable, { [variable]: topic });

    expect(errors).toHaveLength(1);
    expect(Object.values(errors[0]?.constraints ?? {})).toContain(`${variable} must be an exact topic without MQTT wildcards (+ or #)`);
  });

  it.each(["MQTT_TELEMETRY_TOPIC", "MQTT_ALARM_TOPIC"])("accepts the default %s", (variable: string) => {
    expect(topicErrors(variable as TopicVariable, {})).toHaveLength(0);
  });
});

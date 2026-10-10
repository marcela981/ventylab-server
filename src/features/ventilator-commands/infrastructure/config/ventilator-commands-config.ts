/*
 * Funcionalidad: Configuración de los comandos del ventilador
 * Descripción: Resuelve desde ConfigService los ajustes de los comandos: tópicos de comando y de acuse (acuse deshabilitado cuando está vacío) con MQTT_TEST_TOPIC_PREFIX (que debe empezar por letra o dígito; se rechaza un prefijo como "/") antepuesto siempre que NODE_ENV=test para que las pruebas nunca publiquen en el tópico real, codificación, tiempos, frecuencia, gracia del operador, tolerancia y límites de seguridad recortados a los límites compartidos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { Environment, type EnvironmentVariables, MQTT_TEST_TOPIC_PREFIX_PATTERN } from "@/common/infrastructure/config/env.validation";
import { type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { clampSafetyLimits } from "@/features/ventilator-commands/domain/validation/ventilator-command-safety-limits";

const MS_PER_SECOND: number = 1000;

export function applyTestTopicPrefix(topic: string, nodeEnv: Environment, testTopicPrefix: string): string {
  if (nodeEnv !== Environment.Test) {
    return topic;
  }

  return `${testTopicPrefix.replace(/\/+$/, "")}/${topic.replace(/^\/+/, "")}`;
}

function readTestTopicPrefix(configService: ConfigService<EnvironmentVariables, true>): string {
  const prefix: string = configService.get("MQTT_TEST_TOPIC_PREFIX", { infer: true });

  if (!MQTT_TEST_TOPIC_PREFIX_PATTERN.test(prefix)) {
    throw new Error(`Invalid ventilator commands configuration: MQTT_TEST_TOPIC_PREFIX "${prefix}" must start with a letter or digit and contain only letters, digits, _, - and /`);
  }

  return prefix;
}

export function readVentilatorCommandsSettings(configService: ConfigService<EnvironmentVariables, true>): VentilatorCommandsSettings {
  const nodeEnv: Environment = configService.get("NODE_ENV", { infer: true });
  const testTopicPrefix: string = readTestTopicPrefix(configService);
  const ackTopic: string = configService.get("MQTT_COMMAND_ACK_TOPIC", { infer: true }).trim();

  return {
    commandTopic: applyTestTopicPrefix(configService.get("MQTT_COMMAND_TOPIC", { infer: true }), nodeEnv, testTopicPrefix),
    ackTopic: ackTopic.length > 0 ? applyTestTopicPrefix(ackTopic, nodeEnv, testTopicPrefix) : undefined,
    encoding: configService.get("VENTILATOR_COMMAND_ENCODING", { infer: true }),
    timeoutMs: configService.get("VENTILATOR_COMMAND_TIMEOUT_MS", { infer: true }),
    ratePerSecond: configService.get("VENTILATOR_COMMAND_RATE_PER_SECOND", { infer: true }),
    operatorGraceMs: configService.get("VENTILATOR_OPERATOR_GRACE_SECONDS", { infer: true }) * MS_PER_SECOND,
    controlRefreshMs: configService.get("VENTILATOR_CONTROL_REFRESH_MS", { infer: true }),
    applyToleranceRatio: configService.get("VENTILATOR_APPLY_TOLERANCE_RATIO", { infer: true }),
    safety: clampSafetyLimits({
      maxPeep: configService.get("VENTILATOR_SAFETY_MAX_PEEP", { infer: true }),
      maxPressureLimit: configService.get("VENTILATOR_SAFETY_MAX_PRESSURE_LIMIT", { infer: true }),
      maxTidalVolume: configService.get("VENTILATOR_SAFETY_MAX_TIDAL_VOLUME", { infer: true }),
      maxRespiratoryRate: configService.get("VENTILATOR_SAFETY_MAX_RESPIRATORY_RATE", { infer: true }),
      maxIeRatio: configService.get("VENTILATOR_SAFETY_MAX_IE_RATIO", { infer: true }),
    }),
  };
}

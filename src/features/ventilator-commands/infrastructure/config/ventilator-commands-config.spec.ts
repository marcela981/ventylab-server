/*
 * Funcionalidad: Pruebas de la configuración de los comandos del ventilador
 * Descripción: Verifica que en NODE_ENV=test los tópicos de comando y de acuse lleven siempre MQTT_TEST_TOPIC_PREFIX (las pruebas nunca publican en el tópico real), que fuera de pruebas queden intactos, que el acuse vacío lo deshabilite y que los límites de seguridad se recorten a los compartidos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { plainToInstance } from "class-transformer";
import { type ValidationError, validateSync } from "class-validator";

import { VENTILATOR_PARAMETER_LIMITS } from "@/common/domain/ventilator/ventilator-limits";
import { Environment, EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { REAL_ACK_TOPIC, REAL_COMMAND_TOPIC, testCommandsSettings } from "@/features/ventilator-commands/application/testing/ventilator-commands-test-doubles-spec";
import { type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { applyTestTopicPrefix } from "@/features/ventilator-commands/infrastructure/config/ventilator-commands-config";

describe("ventilator commands configuration", () => {
  it("prefixes the command and acknowledgement topics in the test environment", () => {
    const settings: VentilatorCommandsSettings = testCommandsSettings({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });

    expect(settings.commandTopic).toBe(`test/ventylab/${REAL_COMMAND_TOPIC}`);
    expect(settings.ackTopic).toBe(`test/ventylab/${REAL_ACK_TOPIC}`);
    expect(settings.commandTopic).not.toBe(REAL_COMMAND_TOPIC);
  });

  it("keeps the configured topics outside the test environment", () => {
    const settings: VentilatorCommandsSettings = testCommandsSettings({ NODE_ENV: Environment.Production, MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });

    expect([settings.commandTopic, settings.ackTopic]).toEqual([REAL_COMMAND_TOPIC, REAL_ACK_TOPIC]);
  });

  it("joins the prefix and topics without duplicated slashes", () => {
    expect(applyTestTopicPrefix("/ventynet/cmd", Environment.Test, "test/ventylab/")).toBe("test/ventylab/ventynet/cmd");
  });

  it.each(["/", "//", "", " ", "-test", "_test", "test topic", "test/+", "test/#"])("rejects the test topic prefix %p, which could map test topics onto real ones", (prefix: string) => {
    expect(() => testCommandsSettings({ MQTT_TEST_TOPIC_PREFIX: prefix })).toThrow("MQTT_TEST_TOPIC_PREFIX");
  });

  it.each([
    ["/", 1],
    ["-test", 1],
    ["test/ventylab", 0],
    ["ci_run-1/ventylab/", 0],
  ])("validates MQTT_TEST_TOPIC_PREFIX=%p at startup with %i errors", (prefix: string, expectedErrors: number) => {
    const errors: ValidationError[] = validateSync(plainToInstance(EnvironmentVariables, { MQTT_TEST_TOPIC_PREFIX: prefix })).filter(
      (error: ValidationError): boolean => error.property === "MQTT_TEST_TOPIC_PREFIX",
    );

    expect(errors).toHaveLength(expectedErrors);
  });

  it("disables acknowledgements when the topic is empty", () => {
    expect(testCommandsSettings({ MQTT_COMMAND_ACK_TOPIC: "  " }).ackTopic).toBeUndefined();
  });

  it("never lets the safety limits be looser than the shared limits", () => {
    const settings: VentilatorCommandsSettings = testCommandsSettings({ VENTILATOR_SAFETY_MAX_PEEP: 30, VENTILATOR_SAFETY_MAX_TIDAL_VOLUME: 2000 });

    expect([settings.safety.maxPeep, settings.safety.maxTidalVolume]).toEqual([VENTILATOR_PARAMETER_LIMITS.peepCmH2O.max, VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl.max]);
    expect(settings.operatorGraceMs).toBe(15_000);
  });
});

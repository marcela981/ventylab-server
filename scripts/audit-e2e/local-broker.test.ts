/*
 * Funcionalidad: Pruebas de la guarda de broker MQTT de los scripts de prueba
 * Descripción: Verifica con node:test (sin dependencias) que se aceptan los brokers locales, que un broker remoto exige
 *              --allow-remote-test-broker, que los brokers públicos conocidos se rechazan siempre (incluso con la
 *              bandera) y que el broker por defecto sigue MQTT_PUBLIC_PORT. Ejecutar: node --test scripts/audit-e2e/local-broker.test.ts
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { brokerRefusal, defaultLocalBrokerUrl, PUBLIC_BROKER_HOSTS } from "./local-broker.ts";

test("local brokers are accepted", () => {
  for (const url of ["mqtt://127.0.0.1:11883", "mqtt://localhost:1883", "mqtt://[::1]:1883", "mqtt://mosquitto:1883"]) {
    assert.equal(brokerRefusal(url, false), null, url);
  }
});

test("a remote broker needs --allow-remote-test-broker", () => {
  assert.match(brokerRefusal("mqtt://10.0.0.5:1883", false) ?? "", /allow-remote-test-broker/u);
  assert.equal(brokerRefusal("mqtt://10.0.0.5:1883", true), null);
});

test("public brokers are always refused, even with the override", () => {
  for (const host of PUBLIC_BROKER_HOSTS) {
    assert.match(brokerRefusal(`mqtt://${host}:1883`, true) ?? "", /public broker/u, host);
  }

  assert.match(brokerRefusal("wss://eu.broker.hivemq.com:8884/mqtt", true) ?? "", /public broker/u);
});

test("an invalid url is refused without echoing it", () => {
  assert.match(brokerRefusal("not a url", true) ?? "", /not a valid URL/u);
});

test("the default broker is the local stack port", () => {
  assert.equal(defaultLocalBrokerUrl({ MQTT_PUBLIC_PORT: "11883" }), "mqtt://127.0.0.1:11883");
  assert.equal(defaultLocalBrokerUrl({}), "mqtt://127.0.0.1:1883");
});

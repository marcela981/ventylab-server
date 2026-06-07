/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : CommandOutboundAuditor — Gate G2.
 * Descripción   : Verifica el camino inverso al de G1: un comando
 *                 emitido desde el frontend (vía POST /api/simulation/command
 *                 o WS) debe terminar publicado por el backend en el
 *                 topic MQTT de comandos. El auditor se suscribe al
 *                 topic, dispara el comando y mide latencia + valida la
 *                 estructura del payload publicado.
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import { connect as mqttConnect, type MqttClient } from 'mqtt';
import { E2EAuditor, type E2EAuditResult, type Gate } from '../E2EAuditor';
import { E2E_CONFIG } from '../e2e-config';

const SAMPLE_COMMAND = {
  mode: 'VCV',
  tidalVolume: 450,
  respiratoryRate: 14,
  peep: 5,
  fio2: 0.4,
};

export class CommandOutboundAuditor extends E2EAuditor {
  readonly objectiveCode = 'G2';
  readonly objectiveName = 'Comando outbound: WebSocket → backend → MQTT físico.';

  async run(): Promise<E2EAuditResult> {
    const gates: Gate[] = [];
    let mqtt: MqttClient | null = null;

    try {
      try {
        mqtt = await this.connectMqtt();
      } catch (err) {
        gates.push(this.makeGate('G2.0', 'Conexión MQTT al broker', 'FAIL', `No fue posible conectar a ${E2E_CONFIG.MQTT_URL}: ${(err as Error).message}`));
        return this.bundle(gates, [], 'No fue posible auditar: broker MQTT inalcanzable.');
      }

      const received: Array<{ raw: string; ts: number }> = [];
      mqtt.on('message', (topic, payload) => {
        if (topic === E2E_CONFIG.MQTT_COMMAND_TOPIC) {
          received.push({ raw: payload.toString('utf-8'), ts: Date.now() });
        }
      });
      await new Promise<void>((res, rej) => mqtt!.subscribe(E2E_CONFIG.MQTT_COMMAND_TOPIC, { qos: 1 }, (err) => err ? rej(err) : res()));

      const sentAt = Date.now();
      let httpStatus = 0;
      let httpBody: any = null;
      let postFailed: string | null = null;
      try {
        const resp = await fetch(`${E2E_CONFIG.BASE_URL}/api/simulation/command`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(E2E_CONFIG.JWT ? { Authorization: `Bearer ${E2E_CONFIG.JWT}` } : {}),
          },
          body: JSON.stringify({ command: SAMPLE_COMMAND }),
        });
        httpStatus = resp.status;
        httpBody = await resp.json().catch(() => null);
      } catch (err) {
        postFailed = (err as Error).message;
      }

      await this.sleep(Math.max(500, E2E_CONFIG.COMMAND_BUDGET_MS + 100));

      const reached = received[0];
      const latency = reached ? reached.ts - sentAt : -1;
      const structural = reached ? this.validateStructure(reached.raw) : null;

      gates.push(this.makeGate(
        'G2.1',
        'POST /api/simulation/command acepta el comando',
        postFailed ? 'FAIL' : httpStatus >= 200 && httpStatus < 300 ? 'PASS' : httpStatus === 401 ? 'WARN' : 'WARN',
        postFailed
          ? `Fetch falló: ${postFailed}`
          : `HTTP ${httpStatus} body=${JSON.stringify(httpBody).slice(0, 120)}`,
        `${E2E_CONFIG.BASE_URL}/api/simulation/command`,
      ));
      gates.push(this.makeGate(
        'G2.2',
        `Broker recibe el comando dentro de ${E2E_CONFIG.COMMAND_BUDGET_MS}ms`,
        !reached ? 'FAIL' : latency <= E2E_CONFIG.COMMAND_BUDGET_MS ? 'PASS' : 'WARN',
        reached ? `latency=${latency}ms en ${E2E_CONFIG.MQTT_COMMAND_TOPIC}` : 'Comando no llegó al broker en la ventana de espera.',
      ));
      gates.push(this.makeGate(
        'G2.3',
        'Payload publicado tiene los campos requeridos del comando',
        !structural ? 'FAIL' : structural.allRequired ? 'PASS' : 'WARN',
        structural ? `parseable=${structural.parseable}, missing=[${structural.missing.join(',')}]` : 'No payload',
      ));

      const tableRows: Array<Array<string | number>> = [
        ['topic', E2E_CONFIG.MQTT_COMMAND_TOPIC, ''],
        ['payload', reached?.raw.slice(0, 120) ?? '(sin payload)', ''],
        ['latency_ms', latency >= 0 ? latency : 'n/a', E2E_CONFIG.COMMAND_BUDGET_MS],
        ['payload_parseable', structural?.parseable ?? false, ''],
        ['payload_missing', structural ? structural.missing.join(',') || '(ninguno)' : 'n/a', ''],
      ];

      return this.bundle(gates, tableRows);
    } finally {
      if (mqtt) {
        try { await new Promise<void>((res) => mqtt!.end(true, {}, () => res())); } catch { /* noop */ }
      }
    }
  }

  private connectMqtt(): Promise<MqttClient> {
    return new Promise((resolve, reject) => {
      const client = mqttConnect(E2E_CONFIG.MQTT_URL, {
        connectTimeout: E2E_CONFIG.CONNECT_TIMEOUT_MS,
        reconnectPeriod: 0,
      });
      const onConnect = () => { client.removeListener('error', onError); resolve(client); };
      const onError = (err: Error) => { client.removeListener('connect', onConnect); reject(err); };
      client.once('connect', onConnect);
      client.once('error', onError);
    });
  }

  private validateStructure(raw: string): { parseable: boolean; missing: string[]; allRequired: boolean } {
    let parsed: any = null;
    let parseable = false;
    try { parsed = JSON.parse(raw); parseable = true; } catch { /* noop */ }
    const required = ['mode', 'tidalVolume', 'respiratoryRate', 'peep', 'fio2'];
    const missing = parsed ? required.filter((k) => parsed[k] === undefined || parsed[k] === null) : required;
    return { parseable, missing, allRequired: parseable && missing.length === 0 };
  }

  private bundle(gates: Gate[], rows: Array<Array<string | number>>, summaryOverride?: string): E2EAuditResult {
    return {
      objectiveCode: this.objectiveCode,
      objectiveName: this.objectiveName,
      summary: summaryOverride ?? this.summarize(gates),
      gates,
      tables: rows.length === 0 ? [] : [{ title: 'G2 — Comando observado en broker', headers: ['campo', 'valor', 'umbral'], rows }],
      defenseBullets: [
        'Demuestra el camino completo de comando con observación directa en el broker MQTT.',
        'Valida la estructura del payload publicado (modo, Vt, FR, PEEP, FiO₂).',
        'Cuantifica el tiempo backend→broker para auditar el SLO de respuesta del lazo de control.',
      ],
    };
  }

  private sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
}

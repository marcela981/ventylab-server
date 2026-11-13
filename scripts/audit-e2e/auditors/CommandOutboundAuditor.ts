/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : CommandOutboundAuditor — Gate G2.
 * Descripción   : Verifica el camino inverso al de G1: un comando
 *                 emitido desde el frontend (vía POST /api/ventilator/commands)
 *                 debe terminar publicado por el backend en el
 *                 topic MQTT de comandos. El auditor se suscribe al
 *                 topic, dispara el comando y mide latencia + valida la
 *                 estructura del payload publicado. v1.1: contrato
 *                 vigente (POST /api/ventilator/commands → 202
 *                 { commandId, reservationId, status }, exige reserva
 *                 activa y control de operador), correlationId en el
 *                 payload MQTT, estado por Socket.io
 *                 `ventilator:command-status` y credenciales MQTT
 *                 opcionales del broker local.
 * Versión       : 1.1
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import { connect as mqttConnect, type MqttClient } from 'mqtt';
import { io, type Socket } from 'socket.io-client';
import { E2EAuditor, type E2EAuditResult, type Gate } from '../E2EAuditor';
import { E2E_CONFIG } from '../e2e-config';

const COMMANDS_PATH = '/api/ventilator/commands';
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
    let socket: Socket | null = null;

    try {
      try {
        mqtt = await this.connectMqtt();
      } catch (err) {
        gates.push(this.makeGate('G2.0', 'Conexión MQTT al broker', 'FAIL', `No fue posible conectar a ${new URL(E2E_CONFIG.MQTT_URL).host}:${(err as Error).message}`));
        return this.bundle(gates, [], 'No fue posible auditar: broker MQTT inalcanzable.');
      }

      const received: Array<{ raw: string; ts: number }> = [];
      mqtt.on('message', (topic, payload) => {
        if (topic === E2E_CONFIG.MQTT_COMMAND_TOPIC) {
          received.push({ raw: payload.toString('utf-8'), ts: Date.now() });
        }
      });
      await new Promise<void>((res, rej) => mqtt!.subscribe(E2E_CONFIG.MQTT_COMMAND_TOPIC, { qos: 1 }, (err) => err ? rej(err) : res()));

      const statuses: Array<{ commandId?: string; status?: string }> = [];
      socket = await this.connectSocket().catch(() => null);
      socket?.on('ventilator:command-status', (p: { commandId?: string; status?: string }) => statuses.push(p));

      const sentAt = Date.now();
      let httpStatus = 0;
      let httpBody: any = null;
      let postFailed: string | null = null;
      try {
        const resp = await fetch(`${E2E_CONFIG.BASE_URL}${COMMANDS_PATH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(E2E_CONFIG.JWT ? { Authorization: `Bearer ${E2E_CONFIG.JWT}` } : {}),
          },
          body: JSON.stringify(SAMPLE_COMMAND),
        });
        httpStatus = resp.status;
        httpBody = await resp.json().catch(() => null);
      } catch (err) {
        postFailed = (err as Error).message;
      }

      await this.sleep(Math.max(500, E2E_CONFIG.COMMAND_BUDGET_MS + 100));

      const commandId: string | undefined = httpBody?.data?.commandId;
      const reached = commandId
        ? received.find((r) => r.raw.includes(commandId))
        : received[0];
      const commandStatuses = statuses.filter((p) => commandId !== undefined && p.commandId === commandId).map((p) => p.status);
      const latency = reached ? reached.ts - sentAt : -1;
      const structural = reached ? this.validateStructure(reached.raw) : null;

      gates.push(this.makeGate(
        'G2.1',
        `POST ${COMMANDS_PATH} acepta el comando (202)`,
        postFailed ? 'FAIL' : httpStatus === 202 ? 'PASS' : 'WARN',
        postFailed
          ? `Fetch falló: ${postFailed}`
          : `HTTP ${httpStatus} body=${JSON.stringify(httpBody).slice(0, 120)}${httpStatus === 202 ? '' : ' (requiere JWT, reserva activa y control de operador)'}`,
        `${E2E_CONFIG.BASE_URL}${COMMANDS_PATH}`,
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
      gates.push(this.makeGate(
        'G2.4',
        'Socket.io emite ventilator:command-status para el comando',
        commandStatuses.length > 0 ? 'PASS' : 'WARN',
        commandStatuses.length > 0
          ? `estados=[${commandStatuses.join(',')}] commandId=${commandId}`
          : `Sin estados (${!socket ? 'Socket.io no conectó' : !commandId ? 'el comando no fue aceptado' : 'ninguno en la ventana de espera'}).`,
      ));

      const tableRows: Array<Array<string | number>> = [
        ['topic', E2E_CONFIG.MQTT_COMMAND_TOPIC, ''],
        ['payload', reached?.raw.slice(0, 120) ?? '(sin payload)', ''],
        ['latency_ms', latency >= 0 ? latency : 'n/a', E2E_CONFIG.COMMAND_BUDGET_MS],
        ['payload_parseable', String(structural?.parseable ?? false), ''],
        ['payload_missing', structural ? structural.missing.join(',') || '(ninguno)' : 'n/a', ''],
        ['command_status', commandStatuses.join(',') || 'n/a', ''],
      ];

      return this.bundle(gates, tableRows);
    } finally {
      try { socket?.disconnect(); } catch { /* noop */ }
      if (mqtt) {
        try { await new Promise<void>((res) => mqtt!.end(true, {}, () => res())); } catch { /* noop */ }
      }
    }
  }

  private connectSocket(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const s = io(E2E_CONFIG.BASE_URL, {
        timeout: E2E_CONFIG.CONNECT_TIMEOUT_MS,
        reconnection: false,
        auth: E2E_CONFIG.JWT ? { token: E2E_CONFIG.JWT } : undefined,
        transports: ['websocket', 'polling'],
      });
      s.once('connect', () => resolve(s));
      s.once('connect_error', (err: Error) => reject(err));
      setTimeout(() => reject(new Error('socket connect timeout')), E2E_CONFIG.CONNECT_TIMEOUT_MS).unref?.();
    });
  }

  private connectMqtt(): Promise<MqttClient> {
    return new Promise((resolve, reject) => {
      const client = mqttConnect(E2E_CONFIG.MQTT_URL, {
        username: E2E_CONFIG.MQTT_USERNAME,
        password: E2E_CONFIG.MQTT_PASSWORD,
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
    const required = ['mode', 'tidalVolume', 'respiratoryRate', 'peep', 'fio2', 'correlationId'];
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
        'Valida la estructura del payload publicado (modo, Vt, FR, PEEP, FiO₂, correlationId).',
        'Sigue el ciclo de vida del comando por ventilator:command-status (SENT, ACKED, APPLIED, REJECTED o TIMEOUT).',
        'Cuantifica el tiempo backend→broker para auditar el SLO de respuesta del lazo de control.',
      ],
    };
  }

  private sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
}

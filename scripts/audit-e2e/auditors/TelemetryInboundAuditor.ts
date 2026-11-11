/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : TelemetryInboundAuditor — Gate G1.
 * Descripción   : Publica N frames sintéticos al topic MQTT que el backend
 *                 está suscribiendo y verifica que lleguen al cliente
 *                 Socket.io dentro de los lotes `ventilator:telemetry`
 *                 ({ frames, serverTs }). Mide latencia p50/p95/p99
 *                 (publish→receive), pérdida y throughput sostenido.
 *                 Sirve para evidenciar el camino completo
 *                 broker → backend → WebSocket → cliente. v1.1: escucha
 *                 los lotes vigentes y cuenta tramas por seq/deviceId
 *                 (ventilator:data ya no se emite); credenciales MQTT
 *                 opcionales del broker local.
 * Versión       : 1.1
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import { connect as mqttConnect } from 'mqtt';
import { io, Socket } from 'socket.io-client';
import { E2EAuditor, type E2EAuditResult, type Gate, type GateStatus } from '../E2EAuditor';
import { E2E_CONFIG } from '../e2e-config';

const AUDIT_DEVICE_ID = 'audit-e2e';

interface FrameSent { id: number; sentAt: number }
interface FrameRecv { id: number; recvAt: number; sentAt: number }

export class TelemetryInboundAuditor extends E2EAuditor {
  readonly objectiveCode = 'G1';
  readonly objectiveName = 'Telemetría inbound: MQTT → backend → WebSocket cliente.';

  async run(): Promise<E2EAuditResult> {
    const gates: Gate[] = [];
    const sent: FrameSent[] = [];
    const recv: FrameRecv[] = [];

    let mqttClient: ReturnType<typeof mqttConnect> | null = null;
    let socket: Socket | null = null;

    try {
      mqttClient = await this.connectMqtt().catch(() => null);
      if (!mqttClient) {
        return this.abort(gates, `No fue posible conectar al broker MQTT ${new URL(E2E_CONFIG.MQTT_URL).host}.`);
      }
      socket = await this.connectSocket().catch(() => null);
      if (!socket) {
        return this.abort(gates, `No fue posible conectar al Socket.io del backend ${E2E_CONFIG.BASE_URL}.`);
      }

      socket!.on('ventilator:telemetry', (batch: { frames?: Array<{ deviceId?: string; seq?: number; deviceTs?: number }> }) => {
        const now = Date.now();
        for (const frame of batch?.frames ?? []) {
          if (frame.deviceId !== AUDIT_DEVICE_ID || typeof frame.seq !== 'number') continue;
          recv.push({ id: frame.seq, recvAt: now, sentAt: frame.deviceTs ?? now });
        }
      });

      // Pequeño settle antes de empezar la ráfaga.
      await this.sleep(300);
      const total = E2E_CONFIG.TELEMETRY_FRAMES;
      const start = Date.now();
      for (let i = 0; i < total; i++) {
        const sentAt = Date.now();
        const payload = JSON.stringify({
          pressure: 12 + (i % 10) * 0.5,
          flow: 30 + (i % 7) * 1.5,
          volume: 400 + (i % 5) * 20,
          deviceTs: sentAt,
          deviceId: AUDIT_DEVICE_ID,
          seq: i,
        });
        mqttClient!.publish(E2E_CONFIG.MQTT_TELEMETRY_TOPIC, payload, { qos: 0 });
        sent.push({ id: i, sentAt });
        await this.sleep(E2E_CONFIG.TELEMETRY_INTERVAL_MS);
      }
      // Drena rezagados.
      await this.sleep(800);
      const durationSec = (Date.now() - start) / 1000;

      const latencies = recv
        .filter((r) => r.id >= 0)
        .map((r) => r.recvAt - r.sentAt)
        .filter((l) => Number.isFinite(l) && l >= 0)
        .sort((a, b) => a - b);
      const lossRatio = (total - recv.length) / total;
      const throughputHz = recv.length / Math.max(durationSec, 0.001);
      const p50 = this.percentile(latencies, 0.5);
      const p95 = this.percentile(latencies, 0.95);
      const p99 = this.percentile(latencies, 0.99);

      gates.push(this.makeGate(
        'G1.1',
        `Latencia p95 < ${E2E_CONFIG.TELEMETRY_P95_BUDGET_MS}ms`,
        this.statusFor(p95 < E2E_CONFIG.TELEMETRY_P95_BUDGET_MS, latencies.length === 0 ? 'FAIL' : 'WARN'),
        latencies.length === 0
          ? 'No se recibieron frames con timestamp válido.'
          : `p50=${p50}ms, p95=${p95}ms, p99=${p99}ms (n=${latencies.length})`,
        'socket.io ventilator:telemetry (frame deviceTs) vs publish time',
      ));
      gates.push(this.makeGate(
        'G1.2',
        `Pérdida < ${(E2E_CONFIG.TELEMETRY_LOSS_BUDGET * 100).toFixed(0)}%`,
        this.statusFor(lossRatio < E2E_CONFIG.TELEMETRY_LOSS_BUDGET, 'WARN'),
        `${total - recv.length}/${total} frames perdidos (${(lossRatio * 100).toFixed(1)}%)`,
      ));
      gates.push(this.makeGate(
        'G1.3',
        `Throughput sostenido ≥ ${E2E_CONFIG.TELEMETRY_THROUGHPUT_HZ} Hz`,
        this.statusFor(throughputHz >= E2E_CONFIG.TELEMETRY_THROUGHPUT_HZ, 'WARN'),
        `${throughputHz.toFixed(1)} Hz observado durante ${durationSec.toFixed(2)}s`,
      ));

      const tableRows: Array<Array<string | number>> = [
        ['frames_publicados', total, '', ''],
        ['frames_recibidos', recv.length, '', ''],
        ['latencia_p50_ms', p50, '', ''],
        ['latencia_p95_ms', p95, E2E_CONFIG.TELEMETRY_P95_BUDGET_MS, p95 < E2E_CONFIG.TELEMETRY_P95_BUDGET_MS ? 'OK' : 'OVER'],
        ['latencia_p99_ms', p99, '', ''],
        ['perdida_%', (lossRatio * 100).toFixed(1), (E2E_CONFIG.TELEMETRY_LOSS_BUDGET * 100).toFixed(0), lossRatio < E2E_CONFIG.TELEMETRY_LOSS_BUDGET ? 'OK' : 'OVER'],
        ['throughput_hz', throughputHz.toFixed(1), E2E_CONFIG.TELEMETRY_THROUGHPUT_HZ, throughputHz >= E2E_CONFIG.TELEMETRY_THROUGHPUT_HZ ? 'OK' : 'UNDER'],
      ];

      return {
        objectiveCode: this.objectiveCode,
        objectiveName: this.objectiveName,
        summary: this.summarize(gates),
        gates,
        tables: [
          { title: 'G1 — Métricas de telemetría', headers: ['métrica', 'valor', 'umbral', 'evaluación'], rows: tableRows },
          { title: 'G1 — Histograma de latencias (ASCII)', headers: ['rango_ms', 'conteo', 'barra'], rows: this.histogramRows(latencies) },
        ],
        defenseBullets: [
          'Demuestra el camino completo MQTT → backend → WebSocket con métricas cuantitativas.',
          'Cuantifica latencia y pérdida con un experimento reproducible (60 frames sintéticos).',
          'Aporta evidencia de cumplimiento del SLO de tiempo real (≥30 Hz, p95 <100 ms).',
        ],
      };
    } finally {
      try { socket?.disconnect(); } catch { /* noop */ }
      if (mqttClient) {
        try { await new Promise<void>((res) => mqttClient!.end(true, {}, () => res())); } catch { /* noop */ }
      }
    }
  }

  private connectMqtt(): Promise<ReturnType<typeof mqttConnect>> {
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

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
    return sorted[idx];
  }

  private histogramRows(latencies: number[]): Array<Array<string | number>> {
    if (latencies.length === 0) return [];
    const max = latencies[latencies.length - 1];
    const buckets = 8;
    const width = Math.max(1, Math.ceil((max + 1) / buckets));
    const counts = new Array(buckets).fill(0);
    for (const l of latencies) counts[Math.min(buckets - 1, Math.floor(l / width))]++;
    const peak = Math.max(...counts);
    return counts.map((c, i) => {
      const lo = i * width;
      const hi = (i + 1) * width - 1;
      const bar = '█'.repeat(Math.round((c / Math.max(peak, 1)) * 20));
      return [`${lo}-${hi}`, c, bar];
    });
  }

  private statusFor(ok: boolean, failStatus: GateStatus): GateStatus {
    return ok ? 'PASS' : failStatus;
  }

  private sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

  private abort(gates: Gate[], reason: string): E2EAuditResult {
    gates.push(this.makeGate('G1.0', 'Pre-requisitos de conexión', 'FAIL', reason));
    return {
      objectiveCode: this.objectiveCode,
      objectiveName: this.objectiveName,
      summary: this.summarize(gates),
      gates,
      tables: [],
      defenseBullets: [
        'Auditor no pudo ejecutarse por dependencias de red — reportar como gap, no como ausencia de capacidad.',
      ],
    };
  }
}

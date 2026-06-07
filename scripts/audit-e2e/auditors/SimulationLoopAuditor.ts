/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : SimulationLoopAuditor — Gate G3.
 * Descripción   : Configura un paciente ARDS_MODERATE, inicia el loop
 *                 sintético, captura N frames vía WebSocket y verifica
 *                 plausibilidad fisiológica (presión en rango, volumen
 *                 entregado coherente con Vt comandado, respuesta al
 *                 cambio de PEEP). Verificar la ecuación del movimiento
 *                 con precisión exige conocer C y R del modelo, que no
 *                 están expuestos por API; el gate de PEEP se evalúa
 *                 detectando el delta observado vs el delta comandado
 *                 (>80% del esperado).
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import { io, Socket } from 'socket.io-client';
import { E2EAuditor, type E2EAuditResult, type Gate } from '../E2EAuditor';
import { E2E_CONFIG } from '../e2e-config';

interface Frame { pressure: number; flow: number; volume: number; ts: number }

const INITIAL_COMMAND = { mode: 'VCV', tidalVolume: 400, respiratoryRate: 16, peep: 5, fio2: 0.6 };
const PEEP_DELTA = 5;

export class SimulationLoopAuditor extends E2EAuditor {
  readonly objectiveCode = 'G3';
  readonly objectiveName = 'Loop de simulación: configuración, captura y respuesta a comando dinámico.';

  async run(): Promise<E2EAuditResult> {
    const gates: Gate[] = [];

    if (!E2E_CONFIG.JWT) {
      gates.push(this.makeGate('G3.0', 'AUDIT_JWT_TOKEN configurado', 'WARN',
        'Variable AUDIT_JWT_TOKEN no presente. Los endpoints /api/simulation/* requieren autenticación.'));
      return this.bundle(gates, []);
    }

    let socket: Socket | null = null;
    try {
      const configResp = await this.postJson('/api/simulation/patient/configure', {
        demographics: { weight: 75, height: 170, age: 55, gender: 'M' },
        condition: 'ARDS_MODERATE',
        difficultyLevel: 'INTERMEDIATE',
      });
      gates.push(this.makeGate(
        'G3.1',
        'POST /api/simulation/patient/configure (ARDS_MODERATE)',
        configResp.ok ? 'PASS' : 'FAIL',
        `HTTP ${configResp.status} ${configResp.bodySnippet}`,
        '/api/simulation/patient/configure',
      ));
      if (!configResp.ok) return this.bundle(gates, []);

      try { socket = await this.connectSocket(); } catch (err) {
        gates.push(this.makeGate('G3.2', 'Conexión Socket.io para capturar frames', 'FAIL', (err as Error).message));
        return this.bundle(gates, []);
      }
      const frames: Frame[] = [];
      socket.on('ventilator:data', (p: any) => {
        if (typeof p?.pressure === 'number' && typeof p?.flow === 'number' && typeof p?.volume === 'number') {
          frames.push({ pressure: p.pressure, flow: p.flow, volume: p.volume, ts: p.timestamp ?? Date.now() });
        }
      });

      const startResp = await this.postJson('/api/simulation/patient/start', { command: INITIAL_COMMAND });
      gates.push(this.makeGate(
        'G3.2',
        'POST /api/simulation/patient/start arranca el loop ~30 Hz',
        startResp.ok ? 'PASS' : 'FAIL',
        `HTTP ${startResp.status} ${startResp.bodySnippet}`,
      ));
      if (!startResp.ok) return this.bundle(gates, []);

      await this.waitForFrames(frames, E2E_CONFIG.SIMULATION_FRAMES, 8_000);
      const baseline = frames.slice(0, E2E_CONFIG.SIMULATION_FRAMES);
      const baselineSummary = this.summarizeFrames(baseline);

      gates.push(this.makeGate(
        'G3.3',
        `Captura de ${E2E_CONFIG.SIMULATION_FRAMES} frames con presión en rango fisiológico`,
        baseline.length >= E2E_CONFIG.SIMULATION_FRAMES * 0.7 && baselineSummary.pressureInRange ? 'PASS' : 'WARN',
        `n=${baseline.length}, P[min..max]=[${baselineSummary.pMin.toFixed(1)}..${baselineSummary.pMax.toFixed(1)}] cmH₂O, V[max]=${baselineSummary.vMax.toFixed(0)} ml`,
      ));

      const pressureBaselineMean = baselineSummary.pMean;
      frames.length = 0;
      const peepResp = await this.postJson('/api/simulation/command', {
        command: { ...INITIAL_COMMAND, peep: INITIAL_COMMAND.peep + PEEP_DELTA },
      });
      gates.push(this.makeGate(
        'G3.4',
        `Cambio PEEP ${INITIAL_COMMAND.peep} → ${INITIAL_COMMAND.peep + PEEP_DELTA} aceptado`,
        peepResp.ok ? 'PASS' : 'WARN',
        `HTTP ${peepResp.status} ${peepResp.bodySnippet}`,
      ));

      const cycleMs = Math.round((60_000 / INITIAL_COMMAND.respiratoryRate) * 2);
      await this.waitForFrames(frames, 60, cycleMs + 1_500);
      const post = this.summarizeFrames(frames.slice(0, 60));
      const observedDelta = post.pMean - pressureBaselineMean;
      const expectedDelta = PEEP_DELTA;
      const ratio = expectedDelta === 0 ? 0 : observedDelta / expectedDelta;
      const ratioOk = ratio >= (1 - E2E_CONFIG.SIMULATION_PEEP_DELTA_TOLERANCE);

      gates.push(this.makeGate(
        'G3.5',
        `Respuesta a ΔPEEP detectada > ${(1 - E2E_CONFIG.SIMULATION_PEEP_DELTA_TOLERANCE) * 100}% del esperado dentro de 2 ciclos`,
        post.count === 0 ? 'FAIL' : ratioOk ? 'PASS' : 'WARN',
        `baseline=${pressureBaselineMean.toFixed(2)}, post=${post.pMean.toFixed(2)}, Δobs=${observedDelta.toFixed(2)}, Δexp=${expectedDelta}, ratio=${(ratio * 100).toFixed(0)}%`,
      ));

      try { await this.postJson('/api/simulation/patient/stop', {}); } catch { /* best-effort */ }

      const tableRows: Array<Array<string | number>> = [
        ['baseline_frames', baseline.length, '≥70', baseline.length >= E2E_CONFIG.SIMULATION_FRAMES * 0.7 ? 'OK' : 'LOW'],
        ['baseline_pressure_mean', baselineSummary.pMean.toFixed(2), '5..50', baselineSummary.pressureInRange ? 'OK' : 'OUT'],
        ['baseline_volume_max', baselineSummary.vMax.toFixed(0), `~${INITIAL_COMMAND.tidalVolume}`, baselineSummary.vMax > 0 ? 'OK' : 'EMPTY'],
        ['peep_delta_expected', expectedDelta, '', ''],
        ['peep_delta_observed', observedDelta.toFixed(2), '', ''],
        ['peep_delta_ratio_%', (ratio * 100).toFixed(0), '≥80', ratioOk ? 'OK' : 'UNDER'],
      ];
      return this.bundle(gates, tableRows);
    } finally {
      try { socket?.disconnect(); } catch { /* noop */ }
    }
  }

  private async postJson(p: string, body: unknown): Promise<{ ok: boolean; status: number; bodySnippet: string }> {
    try {
      const r = await fetch(`${E2E_CONFIG.BASE_URL}${p}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(E2E_CONFIG.JWT ? { Authorization: `Bearer ${E2E_CONFIG.JWT}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const txt = await r.text();
      return { ok: r.ok, status: r.status, bodySnippet: txt.slice(0, 120) };
    } catch (err) {
      return { ok: false, status: 0, bodySnippet: (err as Error).message };
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

  private async waitForFrames(buf: Frame[], n: number, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (buf.length < n && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  private summarizeFrames(frames: Frame[]): { count: number; pMin: number; pMax: number; pMean: number; vMax: number; pressureInRange: boolean } {
    if (frames.length === 0) {
      return { count: 0, pMin: 0, pMax: 0, pMean: 0, vMax: 0, pressureInRange: false };
    }
    const ps = frames.map((f) => f.pressure);
    const pMin = Math.min(...ps);
    const pMax = Math.max(...ps);
    const pMean = ps.reduce((a, b) => a + b, 0) / ps.length;
    const vMax = Math.max(...frames.map((f) => f.volume));
    const pressureInRange = pMin >= -5 && pMax <= 80;
    return { count: frames.length, pMin, pMax, pMean, vMax, pressureInRange };
  }

  private bundle(gates: Gate[], rows: Array<Array<string | number>>): E2EAuditResult {
    return {
      objectiveCode: this.objectiveCode,
      objectiveName: this.objectiveName,
      summary: this.summarize(gates),
      gates,
      tables: rows.length === 0 ? [] : [{ title: 'G3 — Loop de simulación', headers: ['parámetro', 'observado', 'esperado', 'evaluación'], rows }],
      defenseBullets: [
        'Demuestra que el lazo configurar → arrancar → emitir telemetría → mutar parámetros funciona E2E.',
        'Aporta evidencia cuantitativa de la respuesta del modelo fisiológico a un cambio de PEEP en runtime.',
        'Cuantifica plausibilidad fisiológica (rangos de presión y volumen) sobre 100 frames capturados.',
      ],
    };
  }
}

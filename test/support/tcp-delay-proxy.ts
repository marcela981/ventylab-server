/*
 * Funcionalidad: Proxy TCP de pruebas con latencia configurable
 * Descripción: Servidor net de Node (solo módulos integrados) que reenvía conexiones de 127.0.0.1 hacia un destino local de prueba, con retraso configurable al abrir cada conexión (arranque en frío) y por fragmento en ambos sentidos, cambio de destino en caliente y corte de todas las conexiones activas; se usa para emular una base de datos lenta y la caída y recuperación del broker MQTT
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createConnection, createServer, type AddressInfo, type Server, type Socket } from "node:net";

const LOCAL_HOSTS: readonly string[] = ["localhost", "127.0.0.1"];

export interface ProxyTarget {
  readonly host: string;
  readonly port: number;
}

export interface ProxyLatency {
  readonly connectDelayMs: number;
  readonly chunkDelayMs: number;
}

export interface TcpDelayProxy {
  readonly port: number;
  readonly url: (template: string) => string;
  setTarget(target: ProxyTarget): void;
  setLatency(latency: Partial<ProxyLatency>): void;
  dropConnections(): void;
  readonly connectionCount: number;
  close(): Promise<void>;
}

export function parseTarget(url: string): ProxyTarget {
  const parsed: URL = new URL(url);

  return { host: parsed.hostname, port: Number(parsed.port) };
}

function assertLocalTarget(target: ProxyTarget): void {
  if (!LOCAL_HOSTS.includes(target.host)) {
    throw new Error(`Refusing to proxy to ${target.host}: the delay proxy only forwards to local test containers`);
  }
}

function forwardWithDelay(from: Socket, to: Socket, latency: () => ProxyLatency): void {
  from.on("data", (chunk: Buffer): void => {
    const chunkDelayMs: number = latency().chunkDelayMs;

    if (chunkDelayMs === 0) {
      to.write(chunk);

      return;
    }

    // Equal delays keep FIFO order because Node runs timers with the same timeout in scheduling order.
    setTimeout((): void => {
      if (!to.destroyed) {
        to.write(chunk);
      }
    }, chunkDelayMs);
  });
}

export async function startTcpDelayProxy(initialTarget: ProxyTarget, initialLatency: Partial<ProxyLatency> = {}): Promise<TcpDelayProxy> {
  assertLocalTarget(initialTarget);

  let target: ProxyTarget = initialTarget;
  let latency: ProxyLatency = { connectDelayMs: 0, chunkDelayMs: 0, ...initialLatency };
  const sockets: Set<Socket> = new Set<Socket>();

  const server: Server = createServer((client: Socket): void => {
    sockets.add(client);
    client.pause();

    const destination: ProxyTarget = target;

    setTimeout((): void => {
      if (client.destroyed) {
        return;
      }

      const upstream: Socket = createConnection({ host: destination.host, port: destination.port });

      sockets.add(upstream);
      forwardWithDelay(client, upstream, (): ProxyLatency => latency);
      forwardWithDelay(upstream, client, (): ProxyLatency => latency);

      const closeBoth = (): void => {
        client.destroy();
        upstream.destroy();
        sockets.delete(client);
        sockets.delete(upstream);
      };

      upstream.on("connect", (): void => {
        client.resume();
      });
      upstream.on("error", closeBoth);
      upstream.on("close", closeBoth);
      client.on("error", closeBoth);
      client.on("close", closeBoth);
    }, latency.connectDelayMs);
  });

  await new Promise<void>((resolve: () => void): void => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const port: number = (server.address() as AddressInfo).port;

  return {
    port,
    url: (template: string): string => {
      const parsed: URL = new URL(template);

      parsed.hostname = "127.0.0.1";
      parsed.port = String(port);

      return parsed.toString();
    },
    setTarget: (next: ProxyTarget): void => {
      assertLocalTarget(next);
      target = next;
    },
    setLatency: (next: Partial<ProxyLatency>): void => {
      latency = { ...latency, ...next };
    },
    dropConnections: (): void => {
      for (const socket of sockets) {
        socket.destroy();
      }

      sockets.clear();
    },
    get connectionCount(): number {
      return sockets.size;
    },
    close: async (): Promise<void> => {
      for (const socket of sockets) {
        socket.destroy();
      }

      sockets.clear();
      await new Promise<void>((resolve: () => void): void => {
        server.close((): void => resolve());
      });
    },
  };
}

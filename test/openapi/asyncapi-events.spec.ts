/*
 * Funcionalidad: Prueba de cobertura del contrato AsyncAPI
 * Descripción: Recorre src/ y obtiene los eventos Socket.io que se emiten (segundo argumento de emitToUser/emitToGroup/emitToRole/emitToRoom/emitToRoomsVolatile, primer argumento de broadcast y client.emit, resolviendo constantes y, cuando el evento es una variable, todas las constantes *_EVENT del archivo), los mensajes del cliente (@SubscribeMessage y comparaciones message.event === o !== CONSTANTE) y los eventos SSE escritos por los helpers de streaming; falla si alguno falta en openapi/asyncapi.yaml o en contracts/websocket-events.contracts.ts, si el AsyncAPI documenta eventos Socket.io que nadie emite o recibe, o si una ruta SSE de openapi.json no tiene canal
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT: string = resolve(__dirname, "..", "..");
const SRC: string = join(REPO_ROOT, "src");
const ASYNCAPI: string = readFileSync(join(REPO_ROOT, "openapi", "asyncapi.yaml"), "utf-8");
const WEBSOCKET_CONTRACT: string = readFileSync(join(REPO_ROOT, "contracts", "websocket-events.contracts.ts"), "utf-8");
const OPENAPI: { paths: Record<string, Record<string, { responses?: Record<string, { content?: Record<string, unknown> }> }>> } = JSON.parse(readFileSync(join(REPO_ROOT, "openapi", "openapi.json"), "utf-8"));

// The publisher implementation forwards its own "event" parameter; only its direct client.emit calls name events.
const PUBLISHER_IMPLEMENTATION: string = join("common", "infrastructure", "realtime", "realtime.gateway.ts");

const ROOM_EMITTER: RegExp = /\.(?:emitToUser|emitToGroup|emitToRole|emitToRoom|emitToRoomsVolatile)\(\s*[^,]+,\s*([A-Za-z0-9_]+|"[^"]+")/g;
const DIRECT_EMITTER: RegExp = /(?:\.broadcast|client\.emit)\(\s*([A-Za-z0-9_]+|"[^"]+")/g;
const SUBSCRIBED_MESSAGE: RegExp = /@SubscribeMessage\(\s*([A-Za-z0-9_]+|"[^"]+")/g;
const FORWARDED_MESSAGE: RegExp = /\.event [!=]== ([A-Z0-9_]+|"[^"]+")/g;
const SSE_EVENT: RegExp = /writeEvent\(res, "([a-z]+)"/g;
const STRING_CONSTANT: RegExp = /export const ([A-Z0-9_]+): string = "([^"]+)"/g;

interface SourceFile {
  readonly path: string;
  readonly text: string;
}

function sourceFiles(folder: string): SourceFile[] {
  return readdirSync(folder).flatMap((name: string): SourceFile[] => {
    const path: string = join(folder, name);

    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }

    return path.endsWith(".ts") && !/spec\.ts$/.test(path) ? [{ path, text: readFileSync(path, "utf-8") }] : [];
  });
}

const FILES: SourceFile[] = sourceFiles(SRC);

const CONSTANTS: Map<string, string> = new Map<string, string>(FILES.flatMap((file: SourceFile): [string, string][] => [...file.text.matchAll(STRING_CONSTANT)].map((match: RegExpMatchArray): [string, string] => [match[1], match[2]])));

function resolveToken(token: string): string | undefined {
  if (token.startsWith("\"")) {
    return token.slice(1, -1);
  }

  return CONSTANTS.get(token);
}

function collect(pattern: RegExp, file: SourceFile): { names: string[]; unresolved: boolean } {
  const tokens: string[] = [...file.text.matchAll(pattern)].map((match: RegExpMatchArray): string => match[1]);
  const names: string[] = tokens.map(resolveToken).filter((name: string | undefined): name is string => name !== undefined);

  return { names, unresolved: names.length < tokens.length };
}

function emittedEvents(): Set<string> {
  const events: Set<string> = new Set<string>();

  for (const file of FILES) {
    const isPublisher: boolean = file.path.endsWith(PUBLISHER_IMPLEMENTATION);
    const room: { names: string[]; unresolved: boolean } = isPublisher ? { names: [], unresolved: false } : collect(ROOM_EMITTER, file);
    const direct: { names: string[]; unresolved: boolean } = collect(DIRECT_EMITTER, file);

    [...room.names, ...direct.names].forEach((name: string): void => {
      events.add(name);
    });

    // A wrapper such as _emit(event, payload) hides the name: every event constant the file references may be emitted through it.
    if ((room.unresolved || direct.unresolved) && !isPublisher) {
      for (const match of file.text.matchAll(/\b([A-Z0-9_]+_EVENT)\b/g)) {
        const name: string | undefined = CONSTANTS.get(match[1]);

        if (name !== undefined) {
          events.add(name);
        }
      }
    }
  }

  return events;
}

function clientMessages(): Set<string> {
  const messages: Set<string> = new Set<string>();

  for (const file of FILES) {
    [...collect(SUBSCRIBED_MESSAGE, file).names, ...collect(FORWARDED_MESSAGE, file).names].forEach((name: string): void => {
      messages.add(name);
    });
  }

  return messages;
}

function sseEvents(): Set<string> {
  return new Set<string>(FILES.flatMap((file: SourceFile): string[] => [...file.text.matchAll(SSE_EVENT)].map((match: RegExpMatchArray): string => match[1])));
}

function documentedMessageNames(): Set<string> {
  return new Set<string>([...ASYNCAPI.matchAll(/^\s+name: "([^"]+)"$/gm)].map((match: RegExpMatchArray): string => match[1]));
}

describe("AsyncAPI contract coverage", () => {
  const emitted: Set<string> = emittedEvents();
  const received: Set<string> = clientMessages();
  const sse: Set<string> = sseEvents();
  const documented: Set<string> = documentedMessageNames();

  it("should find the realtime events emitted in src", () => {
    expect(emitted.size).toBeGreaterThanOrEqual(20);
    expect(received).toEqual(new Set<string>(["authenticate", "ventilator:join", "ventilator:heartbeat"]));
    expect(sse).toEqual(new Set<string>(["delta", "done", "error"]));
  });

  it("should document every emitted and received Socket.io event in asyncapi.yaml and the TypeScript contract", () => {
    const names: string[] = [...emitted, ...received].sort();

    expect({
      missingInAsyncApi: names.filter((name: string): boolean => !documented.has(name)),
      missingInContract: names.filter((name: string): boolean => !WEBSOCKET_CONTRACT.includes(`"${name}":`)),
    }).toEqual({ missingInAsyncApi: [], missingInContract: [] });
  });

  it("should not document Socket.io events that nothing emits or receives", () => {
    const stale: string[] = [...documented].filter((name: string): boolean => !emitted.has(name) && !received.has(name) && !sse.has(name));

    expect(stale).toEqual([]);
  });

  it("should give every server-sent-events route of openapi.json a channel with its delta, done and error events", () => {
    const sseRoutes: string[] = Object.entries(OPENAPI.paths).flatMap(([path, item]: [string, Record<string, { responses?: Record<string, { content?: Record<string, unknown> }> }>]): string[] =>
      Object.values(item).some((operation: { responses?: Record<string, { content?: Record<string, unknown> }> }): boolean => Object.values(operation.responses ?? {}).some((response: { content?: Record<string, unknown> }): boolean => response.content?.["text/event-stream"] !== undefined)) ? [path] : []);

    expect(sseRoutes.length).toBeGreaterThan(0);
    expect(sseRoutes.filter((path: string): boolean => !ASYNCAPI.includes(`address: "${path}"`) && !ASYNCAPI.includes(`address: ${path}\n`))).toEqual([]);
    expect([...sse].filter((name: string): boolean => !documented.has(name))).toEqual([]);
  });
});

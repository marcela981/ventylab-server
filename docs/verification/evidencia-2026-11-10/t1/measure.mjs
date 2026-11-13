// Throwaway (T1): runs scripts/simulate-ventilator.ts as a child and measures ventilator:telemetry on Socket.io.
// Usage: node measure.mjs <baseUrl> <tokenFile> <label> -- <simulator args...>
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
const SERVER = "<home>/Documents/Marce/ventylab/wt-rmc-server";
const require = createRequire(`${SERVER}/package.json`);
const { io } = require("socket.io-client");

const [, , base, tokenFile, label, sep, ...simArgs] = process.argv;
const token = readFileSync(tokenFile, "utf8").trim();
const frames = []; // {recv, serverTs, deviceTs, deviceClock, batchTs}
const events = [];
let batches = 0;
const sock = io(base, { auth: { token }, transports: ["websocket"] });
sock.on("connect", () => events.push({ t: Date.now(), e: "socket_connect" }));
sock.on("disconnect", (r) => events.push({ t: Date.now(), e: `socket_disconnect:${r}` }));
sock.on("realtime:authenticated", () => events.push({ t: Date.now(), e: "authenticated" }));
sock.onAny((ev, p) => {
  if (ev === "ventilator:telemetry") {
    const recv = Date.now(); batches++;
    for (const f of p.frames) frames.push({ recv, serverTs: f.serverTs, deviceTs: f.deviceTs, deviceClock: f.deviceClock, batchTs: p.serverTs });
  } else if (ev.startsWith("ventilator:")) events.push({ t: Date.now(), e: ev, p: JSON.stringify(p).slice(0, 120) });
});
await new Promise((r) => setTimeout(r, 2000));
const simOut = [];
const sim = spawn("npx", ["tsx", "scripts/simulate-ventilator.ts", ...simArgs], { cwd: SERVER, shell: true, env: { ...process.env } });
sim.stdout.on("data", (d) => { for (const line of d.toString().split(/\r?\n/)) if (line.trim()) simOut.push({ t: Date.now(), line }); });
sim.stderr.on("data", (d) => simOut.push({ t: Date.now(), line: "ERR " + d.toString().trim() }));
await new Promise((r) => sim.on("exit", r));
await new Promise((r) => setTimeout(r, 3000));
sock.close();

const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
const lineOf = (re) => simOut.find((l) => re.test(l.line));
const stopLine = lineOf(/Stopping/);
const published = stopLine ? Number(/published=(\d+)/.exec(stopLine.line)[1]) : null;
const firstPub = simOut.find((l) => /second 0:/.test(l.line));
let serverNonMono = 0, clockNonMono = 0, dupClock = 0;
const seenClock = new Set();
for (let i = 1; i < frames.length; i++) {
  if (frames[i].serverTs < frames[i - 1].serverTs) serverNonMono++;
  if (frames[i].deviceClock !== undefined && frames[i - 1].deviceClock !== undefined && frames[i].deviceClock < frames[i - 1].deviceClock) clockNonMono++;
}
for (const f of frames) { if (f.deviceClock !== undefined) { if (seenClock.has(f.deviceClock)) dupClock++; seenClock.add(f.deviceClock); } }
const withDev = frames.filter((f) => typeof f.deviceTs === "number");
const lat = withDev.map((f) => f.recv - f.deviceTs);
const backendToWs = frames.map((f) => f.recv - f.batchTs);
// receive gaps
let maxGap = 0, gapEnd = null, gapStart = null;
for (let i = 1; i < frames.length; i++) { const g = frames[i].recv - frames[i - 1].recv; if (g > maxGap) { maxGap = g; gapEnd = frames[i].recv; gapStart = frames[i - 1].recv; } }
const pauseLine = lineOf(/PAUSED/); const resumeLine = lineOf(/publishing again/);
const activeMs = frames.length ? frames[frames.length - 1].recv - frames[0].recv : 0;
const result = {
  label, simArgs: simArgs.join(" "), published, receivedFrames: frames.length, batches,
  lossPct: published ? +(100 * (published - frames.length) / published).toFixed(3) : null,
  receivedRateHz: activeMs ? +(frames.length / (activeMs / 1000)).toFixed(2) : null,
  batchesPerS: activeMs ? +(batches / (activeMs / 1000)).toFixed(2) : null,
  order: { serverTsDecreases: serverNonMono, deviceClockDecreases: clockNonMono, duplicateDeviceClock: dupClock },
  latencyPublishToWsMs: lat.length ? { n: lat.length, p50: pct(lat, 50), p95: pct(lat, 95), p99: pct(lat, 99), max: Math.max(...lat), min: Math.min(...lat) } : null,
  backendBatchToWsMs: backendToWs.length ? { p50: pct(backendToWs, 50), p95: pct(backendToWs, 95), p99: pct(backendToWs, 99) } : null,
  maxReceiveGapMs: maxGap,
  pause: pauseLine ? { pausedAt: pauseLine.t, resumedAt: resumeLine?.t, gapStart, gapEnd, firstFrameAfterResumeMs: resumeLine && gapEnd ? gapEnd - resumeLine.t : null } : null,
  firstPublishLineAt: firstPub?.t,
  events: events.map((e) => ({ ...e, rel: e.t - (frames[0]?.recv ?? e.t) })),
  socketStayedConnected: !events.some((e) => e.e.startsWith("socket_disconnect")) ,
  simTail: simOut.slice(-3).map((l) => l.line),
};
writeFileSync(`${process.argv[1].replace(/measure\.mjs$/, "")}${label}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(0);

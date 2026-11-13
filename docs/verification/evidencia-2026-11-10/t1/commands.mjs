// Throwaway (T1): command checks against the LOCAL compose backend and LOCAL compose broker only.
// Never prints tokens or broker credentials.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
const SERVER = "<home>/Documents/Marce/ventylab/wt-rmc-server";
const require = createRequire(`${SERVER}/package.json`);
const { io } = require("socket.io-client");
const mqtt = require("mqtt");
const T = process.argv[2];
const BASE = "http://127.0.0.1:4000";
const BROKER = `mqtt://127.0.0.1:${process.env.MQTT_PUBLIC_PORT}`;
if (!/^mqtt:\/\/127\.0\.0\.1:\d+$/.test(BROKER)) throw new Error("local broker only");
const tok = (n) => readFileSync(`${T}/${n}.tok`, "utf8").trim();
const student = tok("student"), student2 = tok("student2");
const env = readFileSync(`${SERVER}/deploy/local/compose.env`, "utf8");
const devicePassword = /^MQTT_DEVICE_PASSWORD=(.*)$/m.exec(env)[1].trim();
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
const call = async (token, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, code: j.code ?? j.error?.code ?? null, data: j.data, message: j.message, raw: j };
};
const VCV = { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 6, fio2: 0.4, inspiratoryTime: 1, flowRate: 60, sensitivity: 2 };

// MQTT subscriber on the command topic (device user can read it on the local broker)
const received = [];
const sub = mqtt.connect(BROKER, { username: "ventylab-device", password: devicePassword, clientId: `t1-cmd-sub-${process.pid}` });
await new Promise((res, rej) => { sub.on("connect", res); sub.on("error", rej); });
await new Promise((res) => sub.subscribe("ventilab/device/001/command", { qos: 1 }, res));
sub.on("message", (topic, payload) => { received.push({ t: Date.now(), topic, payload: payload.toString() }); log(`MQTT <- ${topic}: ${payload.toString()}`); });
log("subscribed to ventilab/device/001/command on local broker");

// Simulator keeps the device online (real shape)
const sim = spawn("npx", ["tsx", "scripts/simulate-ventilator.ts", "--shape", "real", "--duration", "90"], { cwd: SERVER, shell: true, env: process.env });
sim.stdout.on("data", () => {});
await new Promise((r) => setTimeout(r, 6000));

const statuses = [];
const sock = io(BASE, { auth: { token: student }, transports: ["websocket"] });
sock.onAny((ev, p) => { if (ev === "ventilator:command-status" || ev === "ventilator:control-changed") { statuses.push({ t: Date.now(), ev, p }); log(`WS ${ev}: ${JSON.stringify(p).slice(0, 220)}`); } });
await new Promise((r) => sock.on("connect", r));

// (b1) student02 without a reservation
let r = await call(student2, "POST", "/api/ventilator/commands", VCV);
log(`(b1) no reservation (estudiante02) -> HTTP ${r.status} code=${r.code} msg=${r.message}`);

// reservation for estudiante01 now
r = await call(student, "POST", "/api/reservations", { holderType: "USER", durationMinutes: 30, purpose: "T1 verification" });
log(`reservation -> HTTP ${r.status} code=${r.code} msg=${r.message}`);
let reservationId = r.data?.id;
if (!reservationId) { const c = await call(student, "GET", "/api/reservations/current"); log(`current -> ${c.status} ${JSON.stringify(c.data)?.slice(0, 200)}`); reservationId = c.data?.reservation?.id ?? c.data?.id; }

// (b2) holder without control
r = await call(student, "POST", "/api/ventilator/commands", VCV);
log(`(b2) reservation but no control -> HTTP ${r.status} code=${r.code} msg=${r.message}`);

r = await call(student, "POST", "/api/ventilator/control");
log(`take control -> HTTP ${r.status} code=${r.code}`);
sock.emit("ventilator:join");
await new Promise((res) => setTimeout(res, 1500));

// (a) valid full VCV snapshot
const before = received.length;
const t0 = Date.now();
r = await call(student, "POST", "/api/ventilator/commands", VCV);
log(`(a) full VCV -> HTTP ${r.status} data=${JSON.stringify(r.data)}`);
await new Promise((res) => setTimeout(res, 5000));
const cid = r.data?.correlationId ?? r.data?.commandId;
const mine = statuses.filter((s) => s.ev === "ventilator:command-status" && JSON.stringify(s.p).includes(cid ?? "@@"));
log(`(a) statuses for ${cid}: ${mine.map((s) => `${s.p.status}${s.p.reason ? `(${s.p.reason})` : ""}@+${s.t - t0}ms`).join(" -> ")}`);
log(`(a) MQTT messages on command topic after POST: ${received.length - before}; payload contains correlationId: ${received.slice(before).some((m) => m.payload.includes(cid))}`);

// (c) out of range
await new Promise((res) => setTimeout(res, 1500));
r = await call(student, "POST", "/api/ventilator/commands", { ...VCV, tidalVolume: 5000 });
log(`(c) tidalVolume 5000 -> HTTP ${r.status} code=${r.code} msg=${r.message} details=${JSON.stringify(r.raw?.data ?? r.raw?.details)?.slice(0, 300)}`);

// release control then (b2') without control
r = await call(student, "DELETE", "/api/ventilator/control");
log(`release control -> HTTP ${r.status}`);
r = await call(student, "POST", "/api/ventilator/commands", VCV);
log(`(b2') after releasing control -> HTTP ${r.status} code=${r.code} msg=${r.message}`);

// cancel reservation
if (reservationId) { r = await call(student, "POST", `/api/reservations/${reservationId}/cancel`, { reason: "T1 verification finished" }); log(`cancel reservation -> HTTP ${r.status} code=${r.code}`); }
log(`total MQTT command messages observed: ${received.length}`);
sock.close(); sub.end(true); sim.kill(); process.exit(0);

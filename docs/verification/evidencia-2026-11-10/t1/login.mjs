// Throwaway (T1): signs a demo account in and stores the access token in a file. Never prints the token or password.
import { readFileSync, writeFileSync } from "node:fs";
const [, , base, email, out] = process.argv;
const src = readFileSync("<home>/Documents/Marce/ventylab/wt-rmc-server/prisma/demo/demo-support.ts", "utf8");
const password = /DEMO_PASSWORD: string = "([^"]+)"/.exec(src)[1];
const res = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
const body = await res.json().catch(() => ({}));
if (!res.ok) { console.log(`login ${email} -> HTTP ${res.status} ${body?.code ?? ""}`); process.exit(1); }
writeFileSync(out, body.data.accessToken);
console.log(`login ${email} -> HTTP ${res.status}, role=${body.data.user?.role ?? "?"} (token stored, <jwt>)`);

/*
 * Funcionalidad: Utilidades de procesos para la verificación
 * Descripción: Ejecuta binarios locales de node_modules con el mismo Node (sin shell, compatible con Windows), captura o transmite su salida y construye entornos mínimos que nunca heredan credenciales ni URLs de servicios remotos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const LOCAL_BINARIES = {
  tsc: "node_modules/typescript/bin/tsc",
  eslint: "node_modules/eslint/bin/eslint.js",
  madge: "node_modules/madge/bin/cli.js",
  prisma: "node_modules/prisma/build/index.js",
  jest: "node_modules/jest/bin/jest.js",
  nest: "node_modules/@nestjs/cli/bin/nest.js",
};

// Only operating-system variables are inherited: application settings (database, MQTT, storage, AI keys) never leak from the caller's shell.
const INHERITED_ENV_KEYS = [
  "PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "windir", "ComSpec", "TEMP", "TMP", "TMPDIR",
  "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "ProgramData", "ProgramFiles", "ProgramFiles(x86)", "CommonProgramFiles",
  "HOMEDRIVE", "HOMEPATH", "USERNAME", "USER", "LANG", "LC_ALL", "TERM", "CI", "DOCKER_HOST", "DOCKER_CONFIG", "DOCKER_CONTEXT",
  "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE", "OS", "SHELL", "npm_execpath", "npm_node_execpath",
];

export function minimalEnv(extra = {}) {
  const env = {};

  for (const key of INHERITED_ENV_KEYS) {
    if (process.env[key] !== undefined) {
      env[key] = process.env[key];
    }
  }

  return { ...env, ...extra };
}

export function localBinary(name) {
  const path = join(REPO_ROOT, LOCAL_BINARIES[name]);

  if (!existsSync(path)) {
    throw new Error(`Local binary "${name}" not found at ${path}; run npm install first`);
  }

  return path;
}

export function run(command, args, { cwd = REPO_ROOT, env = process.env, stream = false, timeoutMs = 0 } = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, { cwd, env, shell: false, windowsHide: true });
    let output = "";
    let timer;

    const collect = (chunk, target) => {
      const text = chunk.toString();

      output += text;

      if (stream) {
        target.write(text);
      }
    };

    child.stdout.on("data", (chunk) => collect(chunk, process.stdout));
    child.stderr.on("data", (chunk) => collect(chunk, process.stderr));

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        output += `\n[verify] ${command} timed out after ${timeoutMs} ms\n`;
        child.kill();
      }, timeoutMs);
    }

    child.on("error", (error) => {
      clearTimeout(timer);
      resolvePromise({ code: 1, output: `${output}\n${error.message}` });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ code: code ?? 1, output });
    });
  });
}

export function runNode(binary, args, options = {}) {
  return run(process.execPath, [localBinary(binary), ...args], options);
}

export function tail(text, lines = 40) {
  return text.trimEnd().split(/\r?\n/).slice(-lines).join("\n");
}

export function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

export function isMainModule(moduleUrl) {
  const entry = process.argv[1];

  return entry !== undefined && resolve(entry).toLowerCase() === fileURLToPath(moduleUrl).toLowerCase();
}

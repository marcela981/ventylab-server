/*
 * Funcionalidad: Instrucciones de las pruebas de carga (npm run test:load)
 * Descripción: Marcador de posición del bloque C7: imprime cómo ejecutar a mano los scripts de k6 (HTTP/Socket.io) y mqttx (MQTT) de scripts/load/ contra un entorno local o de staging; no ejecuta carga y no lo invocan verify ni CI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const LOAD_DIR = dirname(fileURLToPath(import.meta.url));
const scripts = readdirSync(LOAD_DIR).filter((file) => /\.(js|sh|json)$/.test(file) && !file.startsWith("print-load-instructions"));

console.log(`Load tests are manual and never run in verify or CI.

Requirements: k6 (https://k6.io) for HTTP and Socket.io scenarios, mqttx CLI (https://mqttx.app/cli) for MQTT scenarios.
Point them only at a local or staging deployment with a throwaway broker; never at production, Supabase or the physical ventilator.

  k6 run -e BASE_URL=http://127.0.0.1:4000 scripts/load/<scenario>.js
  mqttx bench pub -h 127.0.0.1 -p 1883 -t test/<run-id>/ventynet/data -c 10 -im 33

Available scripts in scripts/load/: ${scripts.length > 0 ? scripts.join(", ") : "none yet (added in block C7)"}`);

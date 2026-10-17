# Diccionario de datos de la exportación de investigación

Columnas de `GET /api/analytics/research/export.csv` (permiso `analytics:research-export`, solo ADMIN), en el orden del archivo. Formato largo: una fila por participante, dominio, elemento y medida. La misma información se sirve en `GET /api/analytics/research/export/dictionary`; ambas salen de `RESEARCH_EXPORT_DICTIONARY` (`src/features/analytics/presentation/utils/research-export-dictionary.ts`), la misma definición que usa el escritor del CSV para el orden de columnas. Si cambia esa constante, este documento se actualiza con ella (la prueba `research-export-dictionary.spec.ts` falla si falta una columna).

| Columna | Tipo | Descripción | Ejemplo |
| --- | --- | --- | --- |
| `participant` | string | Seudónimo del estudiante: HMAC-SHA256 del identificador de usuario con ANALYTICS_EXPORT_SALT, en hexadecimal en minúsculas; la misma sal produce el mismo seudónimo en todas las exportaciones | `3f9a1c0e5b7d2a4c6e8f0a1b3c5d7e9f1a2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d` |
| `group` | string | Seudónimo del grupo de estudiantes: HMAC-SHA256 del identificador del grupo con la misma sal, en hexadecimal en minúsculas | `3f9a1c0e5b7d2a4c6e8f0a1b3c5d7e9f1a2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d` |
| `domain` | string | Dominio de la medida: progress (progreso), grades (notas), simulation (simulación), ai_telemetry (uso de IA) o ai_ratings (valoraciones de IA) | `progress` |
| `item` | string | Elemento medido dentro del dominio: overall o el identificador de la sección en progress, el seudónimo HMAC-SHA256 del prefijo evaluation: seguido del identificador de la evaluación en grades, all en simulation y el nombre del caso de uso de IA en ai_telemetry y ai_ratings | `overall` |
| `metric` | string | Medida: percentage (progress); grade (grades); session_count, average_score y average_time_to_stabilize_s (simulation); calls, input_tokens, output_tokens y average_latency_ms (ai_telemetry); ratings, helpful_rate y &lt;dimensión&gt;_mean para quality, understanding, expression, safety y trust (ai_ratings) | `percentage` |
| `value` | number | Valor numérico de la medida: porcentaje 0–100 en progress, nota en la escala 0–5 en grades, conteos enteros, segundos, milisegundos, proporción 0–1 en helpful_rate y media de la escala de valoración en las dimensiones | `40` |

Sin `ANALYTICS_EXPORT_SALT` la exportación responde 503 y no lee datos. No se exportan nombres, correos, códigos de estudiante ni identificadores originales de usuarios, grupos, evaluaciones, intentos o sesiones. Ver `docs/operation/ANALYTICS.md`.

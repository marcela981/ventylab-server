<!--
  Funcionalidad: Integración de un modelo de IA de terceros
  Descripción: Guía para conectar el modelo entrenado por un tercero (proveedor external del gateway de IA): qué debe entregar el tercero, variables de entorno, los dos formatos de contrato (openai y simple) con ejemplos de petición y respuesta, cómo se comporta en la cadena de respaldo y en la telemetría, cómo probarlo con la sonda de administración y estado actual
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Integración de un modelo de IA de terceros

**Estado actual:** punto de extensión probado con LLM falso; pendiente endpoint real.

El gateway de IA de VentyLab admite, además de Gemini, OpenAI y Anthropic, un proveedor genérico llamado `external` pensado para el modelo que entrene un tercero (por ejemplo, un compañero de maestría). Implementa el mismo puerto `ILlmProvider` que los demás, entra en la cadena de respaldo de cada caso de uso, aparece en el estado del sistema y en la sonda de administración, y sus llamadas quedan en la telemetría con proveedor, modelo, versión del prompt, tokens, latencia y costo.

Se configura solo con variables de entorno: no hay que tocar código para conectarlo.

## 1. Qué debe entregar el tercero

| Elemento | Detalle |
|---|---|
| Endpoint | URL HTTP(S) alcanzable desde el servidor de VentyLab. |
| Formato | `openai` (compatible con `POST /chat/completions` de OpenAI, recomendado) o `simple` (contrato mínimo descrito abajo). |
| Autenticación | Opcional. Una clave y el nombre de la cabecera que la transporta (por defecto `Authorization: Bearer <clave>`). |
| Nombre del modelo | Texto que se envía en el campo `model` y se usa como clave de precio en la telemetría. |
| Límites | Tiempo de respuesta típico, tamaño máximo de entrada y si admite streaming. |
| Precio (opcional) | USD por millón de tokens de entrada y de salida, si se quiere estimar costo; por defecto 0. |
| Conteo de tokens (opcional) | Si el endpoint devuelve `usage`, la telemetría registra tokens y costo; si no, quedan vacíos. |

El texto que se envía al modelo ya pasa por la protección de datos personales del gateway (se eliminan correos y, donde aplica, el nombre del estudiante) y lleva el prompt de sistema educativo común.

## 2. Variables de entorno

| Variable | Obligatoria | Por defecto | Uso |
|---|---|---|---|
| `AI_EXTERNAL_BASE_URL` | sí, para activarlo | — | Formato `openai`: URL base (se agrega `/chat/completions`). Formato `simple`: URL completa del endpoint. |
| `AI_EXTERNAL_MODEL` | sí, para activarlo | — | Modelo que se envía. El modelo `default` de los ajustes por caso de uso se resuelve a este valor. |
| `AI_EXTERNAL_API_KEY` | no | — | Clave; sin ella no se envía cabecera de autenticación. |
| `AI_EXTERNAL_AUTH_HEADER` | no | `Authorization` | Con `Authorization` se envía `Bearer <clave>`; con cualquier otra cabecera (por ejemplo `x-api-key`) se envía la clave tal cual. |
| `AI_EXTERNAL_FORMAT` | no | `openai` | `openai` o `simple`. |
| `AI_EXTERNAL_TIMEOUT_MS` | no | `0` | Tiempo máximo de toda la petición (incluido el stream). `0` deja solo el tiempo límite por intento del caso de uso. |
| `AI_EXTERNAL_PRICE_INPUT_PER_MTOK` | no | `0` | USD por millón de tokens de entrada. |
| `AI_EXTERNAL_PRICE_OUTPUT_PER_MTOK` | no | `0` | USD por millón de tokens de salida. |

El proveedor solo se registra cuando `AI_EXTERNAL_BASE_URL` y `AI_EXTERNAL_MODEL` están definidas. Ejemplo:

```dotenv
AI_EXTERNAL_BASE_URL=https://modelo-companero.example.edu/v1
AI_EXTERNAL_MODEL=ventilacion-tutor-v1
AI_EXTERNAL_API_KEY=change-me
AI_EXTERNAL_FORMAT=openai
AI_EXTERNAL_TIMEOUT_MS=45000
```

## 3. Formato `openai` (recomendado)

Es el contrato de chat completions de OpenAI, que ofrecen la mayoría de servidores de inferencia (vLLM, llama.cpp server, Ollama, LM Studio, TGI con capa compatible).

**Petición sin stream** (`POST {AI_EXTERNAL_BASE_URL}/chat/completions`):

```json
{
  "model": "ventilacion-tutor-v1",
  "messages": [
    { "role": "system", "content": "Eres el asistente educativo de VentyLab..." },
    { "role": "user", "content": "¿Qué es la PEEP?" }
  ],
  "max_tokens": 1024,
  "temperature": 0.4
}
```

Cuando el caso de uso pide JSON se agrega `"response_format": {"type": "json_object"}`.

**Respuesta esperada:**

```json
{
  "model": "ventilacion-tutor-v1",
  "choices": [{ "message": { "content": "La PEEP es la presión positiva al final de la espiración..." }, "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 312, "completion_tokens": 85 }
}
```

**Stream:** la misma petición con `"stream": true, "stream_options": {"include_usage": true}`; el servidor responde `text/event-stream` con eventos `data: {"choices":[{"delta":{"content":"..."}}]}`, un evento final con `usage` (opcional) y `data: [DONE]`.

## 4. Formato `simple` (mínimo)

Para un modelo propio sin capa compatible con OpenAI. No admite stream: en las rutas SSE del tutor la respuesta llega como un solo fragmento seguido de `done`.

**Petición** (`POST {AI_EXTERNAL_BASE_URL}`, cuerpo JSON):

```json
{
  "model": "ventilacion-tutor-v1",
  "system": "Eres el asistente educativo de VentyLab...",
  "messages": [
    { "role": "user", "content": "¿Qué es la PEEP?" }
  ],
  "maxTokens": 1024,
  "temperature": 0.4,
  "responseFormat": "text"
}
```

`messages` alterna `user` y `assistant` (historial de la conversación); `responseFormat` es `text` o `json` (en `json` la respuesta debe ser un objeto JSON en `text`).

**Respuesta esperada** (HTTP 200):

```json
{
  "text": "La PEEP es la presión positiva al final de la espiración...",
  "model": "ventilacion-tutor-v1",
  "usage": { "inputTokens": 312, "outputTokens": 85 }
}
```

Solo `text` es obligatorio; `model` y `usage` son opcionales.

## 5. Errores y respaldo

El gateway clasifica las respuestas del endpoint igual que las de los demás proveedores:

| Respuesta del endpoint | Clasificación | Efecto |
|---|---|---|
| HTTP 429 | `RATE_LIMIT` | Reintento con espera exponencial; si falla, siguiente proveedor de la cadena. |
| HTTP 5xx | `SERVER` | Reintento; si falla, siguiente proveedor. |
| Sin respuesta dentro del tiempo | `TIMEOUT` | Siguiente proveedor, sin reintento. |
| Cuerpo no JSON o sin `text` / `choices[0].message.content` | `INVALID_RESPONSE` | Siguiente proveedor. |
| HTTP 4xx (salvo 408 y 429) | `CLIENT` | Siguiente proveedor. |

Fallos consecutivos abren el cortocircuito del proveedor durante `AI_BREAKER_OPEN_SECONDS`. Si ningún proveedor responde, el caso de uso usa su respuesta determinista (marcada como tal) o responde 503.

## 6. Ubicación en la cadena de proveedores

La cadena por defecto de cada caso de uso es `gemini → openai → anthropic → external`; los proveedores sin configuración se saltan. Para usar el modelo del tercero como principal en un caso de uso, el administrador edita el ajuste de plataforma `ai.useCase.<CASO>` (por ejemplo `ai.useCase.LESSON_QA`) y pone `external` primero en `providerChain`, con `models.external = "default"` (o el nombre de otro modelo del mismo endpoint).

Compatibilidad: el identificador `custom` del proveedor HTTP personalizado retirado se sigue aceptando en cadenas y modelos guardados y se resuelve como `external`; no hace falta migrar los ajustes.

## 7. Cómo probarlo

1. Definir las variables de la sección 2 y reiniciar el backend. En el arranque el registro muestra `AI providers registered: ..., external`.
2. Como administrador, `GET /api/system/status`: el componente `ai` lista `external` con `configured: true`.
3. Sonda manual: `POST /api/system/probe/ai/external` (solo ADMIN, 3 por minuto). Envía un prompt mínimo (`ping` → `OK`, 8 tokens de salida, 10 s) y responde `{provider, model, ok, latencyMs, errorCode?, aiCallId}`. La llamada queda en la telemetría con `refType = health_probe` y no cuenta en las métricas de aprendizaje.
4. En `GET /api/admin/ai-telemetry/export.csv` las llamadas reales aparecen con `provider = external`, el modelo, la versión del prompt, tokens, latencia, TTFT y costo (0 si no se configuró precio).

Prueba local sin el modelo real: cualquier servidor compatible con OpenAI sirve como falso (por ejemplo `ventilab-web/scripts/e2e/fake-llm.mjs`). Las pruebas unitarias `src/features/ai/infrastructure/providers/external.provider.spec.ts` levantan un servidor HTTP falso y cubren ambos formatos: respuesta correcta, stream, 429, 500, tiempo agotado y respuesta malformada.

## 8. Pendiente

- Recibir del tercero el endpoint real, el formato, la clave y el nombre del modelo.
- Ejecutar la sonda de la sección 7 contra ese endpoint y registrar latencia y calidad de las primeras respuestas.
- Acordar el precio por millón de tokens (o dejarlo en 0 si el modelo se aloja sin costo por uso).

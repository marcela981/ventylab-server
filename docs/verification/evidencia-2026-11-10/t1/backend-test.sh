#!/usr/bin/env bash
# Throwaway (T1): TEST backend (NODE_ENV=test) on :4110 against the compose Postgres (127.0.0.1:55432),
# the TEST broker (127.0.0.1:1893, no auth) and the fake LLM (:4911). Never prints values of compose.env.
cd <home>/Documents/Marce/ventylab/wt-rmc-server || exit 1
set -a
. deploy/local/compose.env
set +a
export DATABASE_URL="$(printf '%s' "$DATABASE_URL" | sed -E 's#@postgres:5432/#@127.0.0.1:55432/#')"
export DIRECT_URL="$(printf '%s' "$DIRECT_URL" | sed -E 's#@postgres:5432/#@127.0.0.1:55432/#')"
export NODE_ENV=test PORT=4110
export CORS_ORIGIN=http://localhost:3110 FRONTEND_URL=http://localhost:3110 PRODUCTION_URL=http://localhost:3110
export MQTT_BROKER_URL=mqtt://127.0.0.1:1893
unset MQTT_USERNAME MQTT_PASSWORD
export MQTT_TELEMETRY_TOPIC=test/ventylab/ventynet/data
export MQTT_COMMAND_TOPIC=ventilab/device/001/command
export MQTT_COMMAND_ACK_TOPIC=ventilab/device/001/ack
export OPENAI_BASE_URL=http://127.0.0.1:4911/v1 OPENAI_API_KEY=local
exec node dist/main

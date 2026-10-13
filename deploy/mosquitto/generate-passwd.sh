#!/bin/sh
# Funcionalidad: Generación del archivo de contraseñas de Mosquitto
# Descripción: Crea /mosquitto/auth/passwd con contraseñas cifradas por mosquitto_passwd a partir de variables de entorno (backend, Node-RED, dispositivo y healthcheck) y lo deja legible solo por el usuario mosquitto; falla si falta alguna variable
# Versión: 1.0
# Autor: Marcela Mazo Castro
# Proyecto: VentyLab
# Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
# Institución: Universidad del Valle
# Contacto: marcela.mazo@correounivalle.edu.co
set -eu

: "${MQTT_BACKEND_USERNAME:?MQTT_BACKEND_USERNAME is required}"
: "${MQTT_BACKEND_PASSWORD:?MQTT_BACKEND_PASSWORD is required}"
: "${MQTT_NODERED_USERNAME:?MQTT_NODERED_USERNAME is required}"
: "${MQTT_NODERED_PASSWORD:?MQTT_NODERED_PASSWORD is required}"
: "${MQTT_DEVICE_USERNAME:?MQTT_DEVICE_USERNAME is required}"
: "${MQTT_DEVICE_PASSWORD:?MQTT_DEVICE_PASSWORD is required}"
: "${MQTT_HEALTHCHECK_USERNAME:?MQTT_HEALTHCHECK_USERNAME is required}"
: "${MQTT_HEALTHCHECK_PASSWORD:?MQTT_HEALTHCHECK_PASSWORD is required}"

PASSWD_FILE="/mosquitto/auth/passwd"
TMP_FILE="${PASSWD_FILE}.tmp"

rm -f "$TMP_FILE"

# -c creates the file with the first user, -b takes the password from the argument; the stored value is a salted hash.
mosquitto_passwd -c -b "$TMP_FILE" "$MQTT_BACKEND_USERNAME" "$MQTT_BACKEND_PASSWORD"
mosquitto_passwd -b "$TMP_FILE" "$MQTT_NODERED_USERNAME" "$MQTT_NODERED_PASSWORD"
mosquitto_passwd -b "$TMP_FILE" "$MQTT_DEVICE_USERNAME" "$MQTT_DEVICE_PASSWORD"
mosquitto_passwd -b "$TMP_FILE" "$MQTT_HEALTHCHECK_USERNAME" "$MQTT_HEALTHCHECK_PASSWORD"

chown mosquitto:mosquitto "$TMP_FILE"
chmod 0600 "$TMP_FILE"
mv "$TMP_FILE" "$PASSWD_FILE"

echo "[mosquitto-auth] password file written with 4 users"

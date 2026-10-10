/*
 * Funcionalidad: Puerto IMqttConnection
 * Descripción: Conexión MQTT única de la aplicación con el bróker del ventilador: estado, publicación con QoS (los comandos usan QoS 1), registro de suscripciones que se restauran al reconectar y oyentes de mensajes y de cambios de conexión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const MQTT_CONNECTION_TOKEN: unique symbol = Symbol("MQTT_CONNECTION_TOKEN");

export type MqttQos = 0 | 1 | 2;

export interface MqttPublishOptions {
  readonly qos: MqttQos;
  readonly retain?: boolean;
}

export type MqttMessageListener = (topic: string, payload: Buffer) => void;

export type MqttConnectionStateListener = (connected: boolean) => void;

export interface IMqttConnection {
  readonly isEnabled: boolean;
  readonly isConnected: boolean;
  readonly brokerUrl: string | undefined;
  publish(topic: string, payload: string | Buffer, options: MqttPublishOptions): Promise<void>;
  subscribe(topic: string, qos: MqttQos): void;
  onMessage(listener: MqttMessageListener): () => void;
  onConnectionChange(listener: MqttConnectionStateListener): () => void;
}

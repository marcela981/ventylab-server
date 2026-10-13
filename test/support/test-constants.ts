/*
 * Funcionalidad: Constantes de la infraestructura de pruebas
 * Descripción: Nombres de las variables de entorno que el globalSetup publica para los archivos de prueba, correo del superadmin de prueba y esquema de la línea base sembrada; sin dependencias de la aplicación para que el globalSetup (que no aplica el alias @/) pueda importarlas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const TEST_DATABASE_URL_VAR: string = "VENTYLAB_TEST_DATABASE_URL";
export const TEST_MQTT_URL_VAR: string = "VENTYLAB_TEST_MQTT_URL";
export const TEST_RUN_ID_VAR: string = "VENTYLAB_TEST_RUN_ID";

export const TEST_SUPERADMIN_EMAIL: string = "superadmin@ventylab.test";

export const BASELINE_SCHEMA: string = "test_baseline";

/*
 * Funcionalidad: Versión del contrato de la API
 * Descripción: Constante API_CONTRACT_VERSION que expone GET /api/version; se incrementa cuando la forma de una respuesta cambia de manera incompatible y la web declara la versión de contrato que requiere
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

/**
 * Version of the HTTP response contract served by this backend.
 *
 * Bump it when a response shape changes incompatibly; the web declares the contract it requires
 * and compares it with the value returned by GET /api/version.
 */
export const API_CONTRACT_VERSION: number = 1;

/*
 * Funcionalidad: Preparación del entorno por archivo de prueba
 * Descripción: Antes de importar cualquier módulo de la aplicación fija el entorno explícito de pruebas (contenedores locales, llaves de proveedores vacías, tópicos MQTT aislados) y aborta si la base de datos o el broker no son locales
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import "reflect-metadata";

import { applyTestEnvironment } from "../support/test-env";

applyTestEnvironment();

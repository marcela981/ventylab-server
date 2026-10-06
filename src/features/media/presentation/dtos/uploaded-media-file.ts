/*
 * Funcionalidad: Tipo UploadedMediaFile
 * Descripción: Forma mínima del archivo en memoria que entrega FileInterceptor (Multer) al controlador de media
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface UploadedMediaFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

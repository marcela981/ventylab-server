/*
 * Funcionalidad: Pruebas del cubo de fichas
 * Descripción: Verifica la ráfaga inicial, la espera calculada cuando se agotan las fichas y la recarga proporcional al tiempo transcurrido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { TokenBucket } from "@/features/ventilator-commands/domain/services/token-bucket";

describe("TokenBucket", () => {
  it("allows a burst of its capacity and then asks to wait", () => {
    const bucket: TokenBucket = new TokenBucket(5, 0);

    const waits: number[] = [0, 0, 0, 0, 0, 0].map((): number => bucket.tryConsume(0));

    expect(waits).toEqual([0, 0, 0, 0, 0, 200]);
  });

  it("refills proportionally to the elapsed time", () => {
    const bucket: TokenBucket = new TokenBucket(5, 0);

    for (let i: number = 0; i < 5; i += 1) {
      bucket.tryConsume(0);
    }

    const afterRefill: number = bucket.tryConsume(200);
    const afterSecondTry: number = bucket.tryConsume(200);

    expect(afterRefill).toBe(0);
    expect(afterSecondTry).toBe(200);
  });

  it("reports when it is full again", () => {
    const bucket: TokenBucket = new TokenBucket(2, 0);

    bucket.tryConsume(0);

    expect(bucket.isFull(100)).toBe(false);
    expect(bucket.isFull(500)).toBe(true);
  });
});

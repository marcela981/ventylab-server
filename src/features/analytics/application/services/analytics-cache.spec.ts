/*
 * Funcionalidad: Pruebas de AnalyticsCache
 * Descripción: Verifica con reloj simulado que la caché sirve el mismo valor durante 60 s y vuelve a cargar al vencer, que comparte una carga en curso entre peticiones simultáneas, que olvida una carga fallida y que separa las claves
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ANALYTICS_CACHE_TTL_MS, AnalyticsCache } from "@/features/analytics/application/services/analytics-cache";

describe("AnalyticsCache", () => {
  let cache: AnalyticsCache;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-11T12:00:00.000Z") });
    cache = new AnalyticsCache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("serves the cached value within the TTL and reloads after it", async () => {
    const loader: jest.Mock = jest.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");

    const first: string = await cache.getOrLoad("dashboard:g:admin", loader);
    jest.advanceTimersByTime(ANALYTICS_CACHE_TTL_MS - 1);
    const cached: string = await cache.getOrLoad("dashboard:g:admin", loader);
    jest.advanceTimersByTime(1);
    const reloaded: string = await cache.getOrLoad("dashboard:g:admin", loader);

    expect([first, cached, reloaded]).toEqual(["first", "first", "second"]);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("shares an in-flight load between concurrent requests", async () => {
    const loader: jest.Mock = jest.fn().mockResolvedValue("value");

    const results: string[] = await Promise.all([cache.getOrLoad<string>("k", loader), cache.getOrLoad<string>("k", loader)]);

    expect(results).toEqual(["value", "value"]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("forgets a failed load and keeps keys apart", async () => {
    const failing: jest.Mock = jest.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce("ok");

    await expect(cache.getOrLoad("k", failing)).rejects.toThrow("boom");
    expect(await cache.getOrLoad("k", failing)).toBe("ok");
    expect(await cache.getOrLoad("other", () => Promise.resolve("separate"))).toBe("separate");
    expect(cache.size).toBe(2);
  });
});

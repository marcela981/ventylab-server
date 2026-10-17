/*
 * Funcionalidad: Pruebas de GetAiProvidersUseCase
 * Descripción: Verifica que el caso de uso devuelve el catálogo de proveedores de IA del gateway sin transformarlo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GetAiProvidersUseCase } from "@/features/admin/application/use-cases/get-ai-providers.usecase";
import { type AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiProviderCatalogEntry } from "@/features/ai/domain/results/ai-provider-health";

describe("GetAiProvidersUseCase", () => {
  it("returns the provider catalog of the AI gateway", () => {
    const catalog: AiProviderCatalogEntry[] = [{ provider: "gemini", configured: true, models: ["gemini-2.5-flash"] }];
    const gateway: Pick<AiGateway, "getProviderCatalog"> = { getProviderCatalog: jest.fn().mockReturnValue(catalog) };
    const useCase: GetAiProvidersUseCase = new GetAiProvidersUseCase(gateway as AiGateway);

    const result: AiProviderCatalogEntry[] = useCase.execute();

    expect(result).toEqual(catalog);
  });
});

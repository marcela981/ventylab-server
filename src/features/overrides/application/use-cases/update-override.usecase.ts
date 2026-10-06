/*
 * Funcionalidad: Caso de uso UpdateOverrideUseCase
 * Descripción: Ejecuta la operación UpdateOverride de la feature de personalizaciones de contenido por estudiante; depende de IEventBus, ITransactionManager, CanManageOverridesUseCase, IContentOverrideRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { UpdateOverrideCommand } from "@/features/overrides/application/commands/update-override.command";
import { CanManageOverridesUseCase } from "@/features/overrides/application/use-cases/can-manage-overrides.usecase";
import { type ContentOverride } from "@/features/overrides/domain/entities/content-override.entity";
import { CannotManageOverridesError, ContentOverrideNotFoundError } from "@/features/overrides/domain/overrides.errors";
import { type IContentOverrideRepository, OVERRIDES_REPOSITORY_TOKEN } from "@/features/overrides/domain/repositories/overrides.repository";

/**
 * @throws {ContentOverrideNotFoundError} If the override does not exist
 * @throws {CannotManageOverridesError} If the requester cannot manage overrides for the student
 * @throws {InvalidOverrideDataError} If the new override data does not fit the entity type
 */
@Injectable()
export class UpdateOverrideUseCase {
  public constructor(
    @Inject(OVERRIDES_REPOSITORY_TOKEN)
    private readonly _overridesRepository: IContentOverrideRepository,
    private readonly _canManageOverridesUseCase: CanManageOverridesUseCase,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateOverrideCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const override: ContentOverride | undefined = await this._overridesRepository.getById(command.overrideId, transaction);

      if (!override) {
        throw new ContentOverrideNotFoundError();
      }

      if (!(await this._canManageOverridesUseCase.execute(command.requesterId, command.requesterRole, override.studentId))) {
        throw new CannotManageOverridesError();
      }

      override.update({ overrideData: command.overrideData, isActive: command.isActive, performedBy: command.requesterId });

      await this._overridesRepository.save(override, transaction);

      this._eventBus.publish(override.getEvents());
    });
  }
}

/*
 * Funcionalidad: Caso de uso SaveSimulatorSessionUseCase
 * Descripción: Guarda una sesión del simulador ya completada (registro de parámetros, lecturas, notas y caso clínico) con su hora de finalización
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
import { SaveSimulatorSessionCommand } from "@/features/simulation/application/commands/save-simulator-session.command";
import { SimulatorSession } from "@/features/simulation/domain/entities/simulator-session.entity";
import {
  type ISimulatorSessionsRepository,
  SIMULATOR_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulator-sessions.repository";

@Injectable()
export class SaveSimulatorSessionUseCase {
  public constructor(
    @Inject(SIMULATOR_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulatorSessionsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: SaveSimulatorSessionCommand): Promise<string> {
    const session: SimulatorSession = SimulatorSession.recordCompleted({
      userId: command.userId,
      isRealVentilator: command.isRealVentilator,
      parametersLog: command.parametersLog,
      ventilatorData: command.ventilatorData,
      notes: command.notes,
      clinicalCaseId: command.clinicalCaseId,
    });

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._sessionsRepository.save(session, transaction);

      this._eventBus.publish(session.getEvents());
    });

    return session.id;
  }
}

/*
 * Funcionalidad: Caso de uso CreateSimulatorSessionUseCase
 * Descripción: Abre una sesión del simulador; en modo paciente simulado construye primero el paciente (sin tocar MQTT) y lo registra tras guardar la sesión, en modo ventilador real solo persiste el registro
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
import { CreateSimulatorSessionCommand } from "@/features/simulation/application/commands/create-simulator-session.command";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { SimulatorSession } from "@/features/simulation/domain/entities/simulator-session.entity";
import {
  type ISimulatorSessionsRepository,
  SIMULATOR_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulator-sessions.repository";
import { buildPatient } from "@/features/simulation/domain/services/patient-factory";
import { PatientDataRequiredError } from "@/features/simulation/domain/simulation.errors";
import { type PatientModel } from "@/features/simulation/domain/value-objects/patient-model";

/**
 * @throws {PatientDataRequiredError} If the simulated mode has no patient data, or the patient data has neither a case nor demographics and condition
 * @throws {SimulationCaseNotFoundError} If the patient data references a clinical case that is not in the simulator catalog
 */
@Injectable()
export class CreateSimulatorSessionUseCase {
  public constructor(
    @Inject(SIMULATOR_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulatorSessionsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    private readonly _patientSessions: PatientSimulationSessionsService,
  ) {}

  public async execute(command: CreateSimulatorSessionCommand): Promise<string> {
    let patient: PatientModel | undefined;

    if (!command.isRealVentilator) {
      if (!command.patientData) {
        throw new PatientDataRequiredError();
      }

      patient = buildPatient(command.patientData);
    }

    const session: SimulatorSession = SimulatorSession.start({
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

    if (patient) {
      this._patientSessions.configure(command.userId, patient);
    }

    return session.id;
  }
}

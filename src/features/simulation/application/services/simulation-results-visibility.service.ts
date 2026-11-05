/*
 * Funcionalidad: Visibilidad de los resultados de una sesión de simulación
 * Descripción: Política de resultados del Bloque C aplicada a las sesiones EXAM: el estudiante dueño no ve el puntaje práctico hasta que el docente libera la nota del intento (gradePublishedAt), ni el desglose de la rúbrica, el estado de los objetivos, el desenlace ni la línea de tiempo del debriefing hasta que libera las respuestas (answersReleasedAt). El personal docente y las sesiones libres ven todo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  EXAM_ATTEMPT_READER_TOKEN,
  type ExamAttemptInfo,
  type IExamAttemptReader,
} from "@/features/simulation/application/ports/exam-attempt-reader.interface";
import { type SimulationActor } from "@/features/simulation/application/services/simulation-session-access.service";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";

export interface ResultsVisibility {
  /** Practical score */
  readonly score: boolean;
  /** Rubric breakdown, target status, outcome and debrief timeline */
  readonly correction: boolean;
}

export const FULL_RESULTS_VISIBILITY: ResultsVisibility = { score: true, correction: true };

const STUDENT_ROLE: string = "STUDENT";

export function visibilityFor(session: SimulationSession, actor: SimulationActor, attempt: ExamAttemptInfo | undefined): ResultsVisibility {
  if (!session.isExam || actor.role !== STUDENT_ROLE) {
    return FULL_RESULTS_VISIBILITY;
  }

  return { score: attempt?.gradePublishedAt !== undefined, correction: attempt?.answersReleasedAt !== undefined };
}

@Injectable()
export class SimulationResultsVisibilityService {
  public constructor(
    @Inject(EXAM_ATTEMPT_READER_TOKEN)
    private readonly _examAttemptReader: IExamAttemptReader,
  ) {}

  public async forSession(session: SimulationSession, actor: SimulationActor): Promise<ResultsVisibility> {
    if (!session.isExam || actor.role !== STUDENT_ROLE || session.attemptId === undefined) {
      return visibilityFor(session, actor, undefined);
    }

    return visibilityFor(session, actor, await this._examAttemptReader.getAttempt(session.attemptId));
  }

  public async forSessions(sessions: readonly SimulationSession[], actor: SimulationActor): Promise<Map<string, ResultsVisibility>> {
    const attemptIds: string[] = sessions
      .filter((session: SimulationSession): boolean => session.isExam && session.attemptId !== undefined)
      .map((session: SimulationSession): string => session.attemptId as string);
    const attempts: Map<string, ExamAttemptInfo> = new Map<string, ExamAttemptInfo>(
      actor.role === STUDENT_ROLE && attemptIds.length > 0
        ? (await this._examAttemptReader.getAttempts([...new Set<string>(attemptIds)])).map(
          (attempt: ExamAttemptInfo): [string, ExamAttemptInfo] => [attempt.id, attempt],
        )
        : [],
    );

    return new Map<string, ResultsVisibility>(
      sessions.map((session: SimulationSession): [string, ResultsVisibility] => [
        session.id,
        visibilityFor(session, actor, session.attemptId === undefined ? undefined : attempts.get(session.attemptId)),
      ]),
    );
  }
}

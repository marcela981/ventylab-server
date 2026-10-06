/*
 * Funcionalidad: Pruebas de la guarda de eliminación curricular
 * Descripción: Verifica que un subárbol sin datos de estudiantes se elimine físicamente y que cualquier dato de estudiante (progreso, lecciones completadas, progreso de páginas, intentos de quiz o notas) exija archivar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ARCHIVE_REQUIRED_DECISION,
  decideDeletion,
  type DeleteDecision,
  HARD_DELETE_DECISION,
  type StudentDataCounts,
} from "@/features/curriculum/domain/services/delete-guard";

const EMPTY_COUNTS: StudentDataCounts = { userProgress: 0, lessonCompletions: 0, pageProgress: 0, quizAttempts: 0, notes: 0 };

describe("decideDeletion", () => {
  it("allows a hard delete when there is no student data", () => {
    const decision: DeleteDecision = decideDeletion(EMPTY_COUNTS);

    expect(decision).toBe(HARD_DELETE_DECISION);
  });

  it.each<keyof StudentDataCounts>(["userProgress", "lessonCompletions", "pageProgress", "quizAttempts", "notes"])(
    "requires archiving when %s exist",
    (field: keyof StudentDataCounts) => {
      const counts: StudentDataCounts = { ...EMPTY_COUNTS, [field]: 1 };

      const decision: DeleteDecision = decideDeletion(counts);

      expect(decision).toBe(ARCHIVE_REQUIRED_DECISION);
    },
  );
});

/**
 * Teacher-Student Relationship Service
 *
 * Business logic for managing teacher-student assignments.
 *
 * ACCESS RULES:
 * - Teachers: Can view ONLY their assigned students
 * - Admin & Superuser: Can assign/remove any relationship, view all
 * - Students: Cannot access or modify relationships
 *
 * FUTURE EXTENSIONS:
 * - Add courseId parameter for course-specific assignments
 * - Add groupId for group-based assignments
 * - Add bulk assignment operations
 */

import { prisma } from '../../shared/infrastructure/database';
import { USER_ROLES } from '../../config/constants';

// ============================================
// Interfaces
// ============================================

export interface TeacherStudentResponse {
  id: string;
  teacherId: string;
  studentId: string;
  createdAt: Date;
  teacher?: {
    id: string;
    name: string | null;
    email: string;
  };
  student?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface AssignStudentInput {
  teacherId: string;
  studentId: string;
}

export interface StudentWithProgress {
  id: string;
  name: string | null;
  email: string;
  assignedAt: Date;
  progress?: {
    completedLessons: number;
    totalTimeSpent: number;
    lastAccess: Date | null;
  };
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate that a user exists and has the specified role
 */
async function validateUserRole(
  userId: string,
  expectedRoles: string[],
  userType: string
): Promise<{ id: string; name: string | null; email: string; role: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    throw new Error(`${userType} no encontrado con ID: ${userId}`);
  }

  if (!expectedRoles.includes(user.role)) {
    throw new Error(
      `El usuario con ID ${userId} no tiene el rol requerido. ` +
        `Roles esperados: ${expectedRoles.join(', ')}. Rol actual: ${user.role}`
    );
  }

  return user;
}

// ============================================
// Service Functions
// ============================================

/**
 * Assign a student to a teacher
 *
 * ACCESS: Admin and Superuser only
 *
 * Validates:
 * - Teacher exists and has role TEACHER, ADMIN, or SUPERUSER
 * - Student exists and has role STUDENT
 * - Relationship doesn't already exist
 */
export async function assignStudent(
  input: AssignStudentInput
): Promise<TeacherStudentResponse> {
  const { teacherId, studentId } = input;

  // Validate teacher has appropriate role
  const teacher = await validateUserRole(
    teacherId,
    [USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.SUPERUSER],
    'Profesor'
  );

  // Validate student has STUDENT role
  const student = await validateUserRole(studentId, [USER_ROLES.STUDENT], 'Estudiante');

  // Check if relationship already exists
  const existing = await prisma.teacherStudent.findUnique({
    where: {
      teacherId_studentId: {
        teacherId,
        studentId,
      },
    },
  });

  if (existing) {
    throw new Error(
      `El estudiante ${student.name || student.email} ya está asignado ` +
        `al profesor ${teacher.name || teacher.email}`
    );
  }

  // Create the relationship
  const relationship = await prisma.teacherStudent.create({
    data: {
      teacherId,
      studentId,
    },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      student: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return {
    id: relationship.id,
    teacherId: relationship.teacherId,
    studentId: relationship.studentId,
    createdAt: relationship.createdAt,
    teacher: relationship.teacher,
    student: relationship.student,
  };
}

/**
 * Remove a teacher-student relationship by ID
 *
 * ACCESS: Admin and Superuser only
 */
export async function removeRelationship(relationshipId: string): Promise<void> {
  const relationship = await prisma.teacherStudent.findUnique({
    where: { id: relationshipId },
  });

  if (!relationship) {
    throw new Error(`Relación no encontrada con ID: ${relationshipId}`);
  }

  await prisma.teacherStudent.delete({
    where: { id: relationshipId },
  });
}

/**
 * Remove a teacher-student relationship by teacher and student IDs
 *
 * ACCESS: Admin and Superuser only
 */
export async function removeRelationshipByPair(
  teacherId: string,
  studentId: string
): Promise<void> {
  const relationship = await prisma.teacherStudent.findUnique({
    where: {
      teacherId_studentId: {
        teacherId,
        studentId,
      },
    },
  });

  if (!relationship) {
    throw new Error(
      `No existe relación entre el profesor ${teacherId} y el estudiante ${studentId}`
    );
  }

  await prisma.teacherStudent.delete({
    where: {
      teacherId_studentId: {
        teacherId,
        studentId,
      },
    },
  });
}

/**
 * Get all students assigned to a teacher
 *
 * ACCESS:
 * - Teachers can only access their own students
 * - Admin and Superuser can access any teacher's students
 *
 * @param teacherId - The teacher's user ID
 * @param includeProgress - Include aggregated progress data for each student
 */
export async function getTeacherStudents(
  teacherId: string,
  includeProgress: boolean = false
): Promise<StudentWithProgress[]> {
  // Verify teacher exists
  await validateUserRole(
    teacherId,
    [USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.SUPERUSER],
    'Profesor'
  );

  const relationships = await prisma.teacherStudent.findMany({
    where: { teacherId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          ...(includeProgress && {
            lessonCompletions: {
              select: {
                isCompleted: true,
                timeSpent: true,
                lastAccessed: true,
              },
            },
          }),
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return relationships.map((rel) => {
    const studentData: StudentWithProgress = {
      id: rel.student.id,
      name: rel.student.name,
      email: rel.student.email,
      assignedAt: rel.createdAt,
    };

    // Add progress data if requested
    if (includeProgress && 'lessonCompletions' in rel.student) {
      // Cast through unknown due to conditional include type inference limitations
      const lessonCompletions = (rel.student as unknown as {
        lessonCompletions: Array<{
          isCompleted: boolean;
          timeSpent: number;
          lastAccessed: Date | null;
        }>;
      }).lessonCompletions;

      const completedLessons = lessonCompletions.filter((l) => l.isCompleted).length;
      const totalTimeSpent = lessonCompletions.reduce((acc, l) => acc + l.timeSpent, 0);
      const lastAccess = lessonCompletions.reduce(
        (latest: Date | null, l) => {
          if (!l.lastAccessed) return latest;
          if (!latest) return l.lastAccessed;
          return l.lastAccessed > latest ? l.lastAccessed : latest;
        },
        null as Date | null
      );

      studentData.progress = {
        completedLessons,
        totalTimeSpent,
        lastAccess,
      };
    }

    return studentData;
  });
}

/**
 * Get all teachers assigned to a student
 *
 * ACCESS: Admin and Superuser only (for future use)
 *
 * @param studentId - The student's user ID
 */
export async function getStudentTeachers(
  studentId: string
): Promise<Array<{ id: string; name: string | null; email: string; assignedAt: Date }>> {
  // Verify student exists
  await validateUserRole(studentId, [USER_ROLES.STUDENT], 'Estudiante');

  const relationships = await prisma.teacherStudent.findMany({
    where: { studentId },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return relationships.map((rel) => ({
    id: rel.teacher.id,
    name: rel.teacher.name,
    email: rel.teacher.email,
    assignedAt: rel.createdAt,
  }));
}

/**
 * Check if a teacher has access to a specific student
 *
 * Used for ownership verification in middleware/controllers
 *
 * @param teacherId - The teacher's user ID
 * @param studentId - The student's user ID
 * @returns true if the teacher is assigned to the student
 */
export async function isStudentAssignedToTeacher(
  teacherId: string,
  studentId: string
): Promise<boolean> {
  const relationship = await prisma.teacherStudent.findUnique({
    where: {
      teacherId_studentId: {
        teacherId,
        studentId,
      },
    },
  });

  return !!relationship;
}

/**
 * Get detailed progress for a specific student
 *
 * ACCESS:
 * - Teachers can only access their assigned students' progress
 * - Admin and Superuser can access any student's progress
 *
 * @param studentId - The student's user ID
 */
export async function getStudentDetailedProgress(studentId: string): Promise<{
  student: { id: string; name: string | null; email: string };
  modules: Array<{
    moduleId: string;
    moduleTitle: string;
    completionPercentage: number;
    completedLessons: number;
    totalLessons: number;
    totalTimeSpent: number;
    lastAccess: Date | null;
  }>;
  overall: {
    totalCompletedLessons: number;
    totalTimeSpent: number;
    lastAccess: Date | null;
  };
}> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!student) {
    throw new Error(`Estudiante no encontrado con ID: ${studentId}`);
  }

  if (student.role !== USER_ROLES.STUDENT) {
    throw new Error('El usuario especificado no es un estudiante');
  }

  // Get all UserProgress records for this student (replaces LearningProgress)
  const userProgressRecords = await prisma.userProgress.findMany({
    where: { userId: studentId },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          lessons: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
    },
  });

  // Get all LessonCompletion records for this student (replaces LessonProgress)
  const allCompletions = await prisma.lessonCompletion.findMany({
    where: { userId: studentId },
    select: { lessonId: true, isCompleted: true, timeSpent: true, lastAccessed: true },
  });
  const completionByLesson = new Map(allCompletions.map((c) => [c.lessonId, c]));

  // Build progress by module
  const moduleProgress = userProgressRecords.map((up) => {
    const moduleLessonIds = new Set(up.module.lessons.map((l) => l.id));
    const moduleCompletions = allCompletions.filter((c) => moduleLessonIds.has(c.lessonId));
    const completedLessons = moduleCompletions.filter((l) => l.isCompleted).length;
    const totalTimeSpent = moduleCompletions.reduce((acc, l) => acc + l.timeSpent, 0);
    const lastAccess = moduleCompletions.reduce(
      (latest: Date | null, l) => {
        if (!l.lastAccessed) return latest;
        if (!latest) return l.lastAccessed;
        return l.lastAccessed > latest ? l.lastAccessed : latest;
      },
      null as Date | null
    );

    const totalLessons = up.module.lessons.length;
    const completionPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      moduleId: up.module.id,
      moduleTitle: up.module.title,
      completionPercentage,
      completedLessons,
      totalLessons,
      totalTimeSpent,
      lastAccess,
    };
  });

  // Calculate overall progress
  const totalCompletedLessons = allCompletions.filter((l) => l.isCompleted).length;
  const totalTimeSpent = allCompletions.reduce((acc, l) => acc + l.timeSpent, 0);
  const lastAccess = allCompletions.reduce(
    (latest: Date | null, l) => {
      if (!l.lastAccessed) return latest;
      if (!latest) return l.lastAccessed;
      return l.lastAccessed > latest ? l.lastAccessed : latest;
    },
    null as Date | null
  );

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
    },
    modules: moduleProgress,
    overall: {
      totalCompletedLessons,
      totalTimeSpent,
      lastAccess,
    },
  };
}

/**
 * Get all teacher-student relationships (Admin view)
 *
 * ACCESS: Admin and Superuser only
 */
export async function getAllRelationships(): Promise<TeacherStudentResponse[]> {
  const relationships = await prisma.teacherStudent.findMany({
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      student: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return relationships.map((rel) => ({
    id: rel.id,
    teacherId: rel.teacherId,
    studentId: rel.studentId,
    createdAt: rel.createdAt,
    teacher: rel.teacher,
    student: rel.student,
  }));
}

/**
 * Get count of students for a teacher
 *
 * @param teacherId - The teacher's user ID
 */
export async function getStudentCount(teacherId: string): Promise<number> {
  return prisma.teacherStudent.count({
    where: { teacherId },
  });
}

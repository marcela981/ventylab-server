/**
 * Admin Types
 */

export interface StudentListItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  progress?: {
    completedModules: number;
    totalModules: number;
    overallPercentage: number;
  };
}

export interface PlatformStatistics {
  totalStudents: number;
  totalTeachers: number;
  totalModules: number;
  totalLessons: number;
  averageProgress: number;
}

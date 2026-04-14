/**
 * Admin Types
 * Matches the shapes returned by admin.service.ts and consumed by the frontend.
 */

/** Single student row in GET /admin/students */
export interface StudentListItem {
  id: string;
  name: string | null;
  email: string;
  lastActivity: Date | null;
  overallProgress: number;       // 0-100
  completedModules: number;
  totalModules: number;
  groupName: string | null;
}

/** Pagination envelope returned by GET /admin/students */
export interface StudentListResult {
  students: StudentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Recent activity entry in GET /admin/statistics */
export interface RecentActivityItem {
  userId: string;
  userName: string | null;
  action: string;
  timestamp: Date | null;
}

/** Full statistics payload returned by GET /admin/statistics */
export interface PlatformStatistics {
  totalStudents: number;
  activeStudents: number;         // accessed in last 30 days
  totalTeachers: number;
  totalAdmins: number;
  totalGroups: number;
  totalModules: number;
  publishedModules: number;
  totalLessons: number;
  totalEvaluations: number;
  totalSimulatorSessions: number;
  averageProgress: number;        // 0-100, across all UserProgress records
  completionRate: number;         // % of students with ≥ 1 completed module
  completionsToday: number;
  recentActivity: RecentActivityItem[];
  hasActiveReservation: boolean;
  activeReservationUserId: string | null;
  activeReservationGroupId: string | null;
  activeReservationLeaderId: string | null;
  generatedAt: Date;
}

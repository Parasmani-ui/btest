export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'group_admin' | 'admin';
  organizationId?: string; // For group users
  organizationName?: string; // For group users
  createdAt: string;
  lastLoginAt: string;
  profileComplete: boolean;
  totalPlaytime?: number; // in minutes
  gamesPlayed?: number;
  casesCompleted?: number;
  averageScore?: number;
  lastUpdated?: string; // timestamp of last stats update
  gameTypePerformance?: {
    [gameType: string]: {
      played: number;
      solved: number;
      averageScore: number;
    };
  };
}

export interface Organization {
  id: string;
  name: string;
  adminId: string; // User ID of the organization admin
  userIds: string[]; // Array of user IDs in this organization
  createdAt: string;
  totalUsers: number;
  totalPlaytime: number; // Total playtime across all users
  totalSessions: number;
}

export interface GameSession {
  id: string;
  userId: string;
  gameType: 'quick' | 'simulation' | 'hospital' | 'fake-news' | 'chainfail' | 'forensic-audit' | 'food-safety' | 'negotiation' | 'financial-negotiation';
  startedAt: string;
  endedAt?: string;
  completedAt?: string;
  duration: number; // in minutes
  score?: number;
  caseSolved: boolean;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  organizationId?: string | null; // If user belongs to an organization
  evidence: string[]; // Evidence found during the game
  actions: string[]; // Actions taken during the game (interrogations, searches, etc.)
  hints: number; // Number of hints used
  timeSpent: number; // Real-time spent in minutes (updates during game)
}

export interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalSessions: number;
  totalPlaytime: number; // in minutes
  averageSessionDuration: number;
  topPerformingUsers: UserData[];
  topPerformingOrganizations: Organization[];
  gameTypeStats: {
    [key: string]: {
      totalSessions: number;
      totalPlaytime: number;
      averageScore: number;
    };
  };
}

export interface UserStats {
  totalPlaytime: number;
  gamesPlayed: number;
  casesCompleted: number;
  averageScore: number;
  recentSessions: GameSession[];
  gameTypeBreakdown: {
    [key: string]: {
      sessions: number;
      playtime: number;
      averageScore: number;
    };
  };
}

export interface GroupStats {
  organizationId: string;
  organizationName: string;
  totalUsers: number;
  totalPlaytime: number;
  totalSessions: number;
  averageUserPlaytime: number;
  topUsers: UserData[];
  recentActivity: GameSession[];
  gameTypeStats: {
    [key: string]: {
      totalSessions: number;
      totalPlaytime: number;
      averageScore: number;
    };
  };
} 
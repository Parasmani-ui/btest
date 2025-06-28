import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  UserData, 
  Organization, 
  GameSession, 
  DashboardStats, 
  UserStats, 
  GroupStats 
} from '@/types/user';

// User-related functions
export async function getUserGames(uid: string): Promise<UserStats> {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data() as UserData;

    // Get user's game sessions - handle case where collection doesn't exist
    let sessions: GameSession[] = [];
    try {
      const sessionsQuery = query(
        collection(db, 'gameSessions'),
        where('userId', '==', uid),
        orderBy('startedAt', 'desc')
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GameSession[];
    } catch (sessionError) {
      console.log('No game sessions found or collection does not exist:', sessionError);
      sessions = [];
    }

    // Calculate stats
    const totalPlaytime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const gamesPlayed = sessions.length;
    const casesCompleted = sessions.filter(session => session.caseSolved).length;
    const averageScore = sessions.reduce((sum, session) => sum + (session.score || 0), 0) / sessions.length || 0;

    // Game type breakdown
    const gameTypeBreakdown: { [key: string]: { sessions: number; playtime: number; averageScore: number } } = {};
    sessions.forEach(session => {
      if (!gameTypeBreakdown[session.gameType]) {
        gameTypeBreakdown[session.gameType] = {
          sessions: 0,
          playtime: 0,
          averageScore: 0
        };
      }
      gameTypeBreakdown[session.gameType].sessions++;
      gameTypeBreakdown[session.gameType].playtime += session.duration;
      gameTypeBreakdown[session.gameType].averageScore = 
        (gameTypeBreakdown[session.gameType].averageScore * (gameTypeBreakdown[session.gameType].sessions - 1) + 
         (session.score || 0)) / gameTypeBreakdown[session.gameType].sessions;
    });

    return {
      totalPlaytime,
      gamesPlayed,
      casesCompleted,
      averageScore,
      recentSessions: sessions.slice(0, 10), // Last 10 sessions
      gameTypeBreakdown
    };
  } catch (error) {
    console.error('Error getting user games:', error);
    throw error;
  }
}

// Group/Organization functions
export async function getGroupUsersWithGames(orgId: string): Promise<GroupStats> {
  try {
    // Get organization data
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    const orgData = orgDoc.data() as Organization;

    if (!orgData) {
      throw new Error('Organization not found');
    }

    // Get all users in the organization
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', orgId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as UserData[];

    // Get all game sessions for the organization
    const sessionsQuery = query(
      collection(db, 'gameSessions'),
      where('organizationId', '==', orgId),
      orderBy('startedAt', 'desc')
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameSession[];

    // Calculate group stats
    const totalPlaytime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalSessions = sessions.length;
    const averageUserPlaytime = users.length > 0 ? totalPlaytime / users.length : 0;

    // Top users by playtime
    const userPlaytimes = new Map<string, number>();
    sessions.forEach(session => {
      const current = userPlaytimes.get(session.userId) || 0;
      userPlaytimes.set(session.userId, current + session.duration);
    });

    const topUsers = users
      .map(user => ({
        ...user,
        totalPlaytime: userPlaytimes.get(user.uid) || 0
      }))
      .sort((a, b) => b.totalPlaytime - a.totalPlaytime)
      .slice(0, 5);

    // Game type stats
    const gameTypeStats: { [key: string]: { totalSessions: number; totalPlaytime: number; averageScore: number } } = {};
    sessions.forEach(session => {
      if (!gameTypeStats[session.gameType]) {
        gameTypeStats[session.gameType] = {
          totalSessions: 0,
          totalPlaytime: 0,
          averageScore: 0
        };
      }
      gameTypeStats[session.gameType].totalSessions++;
      gameTypeStats[session.gameType].totalPlaytime += session.duration;
      gameTypeStats[session.gameType].averageScore = 
        (gameTypeStats[session.gameType].averageScore * (gameTypeStats[session.gameType].totalSessions - 1) + 
         (session.score || 0)) / gameTypeStats[session.gameType].totalSessions;
    });

    return {
      organizationId: orgId,
      organizationName: orgData.name,
      totalUsers: users.length,
      totalPlaytime,
      totalSessions,
      averageUserPlaytime,
      topUsers,
      recentActivity: sessions.slice(0, 20), // Last 20 sessions
      gameTypeStats
    };
  } catch (error) {
    console.error('Error getting group users with games:', error);
    throw error;
  }
}

// Admin functions
export async function getAllStats(): Promise<DashboardStats> {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as UserData[];

    // Get all organizations
    const orgsSnapshot = await getDocs(collection(db, 'organizations'));
    const organizations = orgsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Organization[];

    // Get all game sessions
    const sessionsSnapshot = await getDocs(collection(db, 'gameSessions'));
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameSession[];

    // Calculate global stats
    const totalPlaytime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionDuration = sessions.length > 0 ? totalPlaytime / sessions.length : 0;

    // Top performing users
    const userStats = new Map<string, { playtime: number; score: number; sessions: number }>();
    sessions.forEach(session => {
      const current = userStats.get(session.userId) || { playtime: 0, score: 0, sessions: 0 };
      userStats.set(session.userId, {
        playtime: current.playtime + session.duration,
        score: current.score + (session.score || 0),
        sessions: current.sessions + 1
      });
    });

    const topPerformingUsers = users
      .map(user => {
        const stats = userStats.get(user.uid) || { playtime: 0, score: 0, sessions: 0 };
        return {
          ...user,
          totalPlaytime: stats.playtime,
          averageScore: stats.sessions > 0 ? stats.score / stats.sessions : 0
        };
      })
      .sort((a, b) => b.totalPlaytime - a.totalPlaytime)
      .slice(0, 10);

    // Top performing organizations
    const topPerformingOrganizations = organizations
      .sort((a, b) => b.totalPlaytime - a.totalPlaytime)
      .slice(0, 5);

    // Game type stats
    const gameTypeStats: { [key: string]: { totalSessions: number; totalPlaytime: number; averageScore: number } } = {};
    sessions.forEach(session => {
      if (!gameTypeStats[session.gameType]) {
        gameTypeStats[session.gameType] = {
          totalSessions: 0,
          totalPlaytime: 0,
          averageScore: 0
        };
      }
      gameTypeStats[session.gameType].totalSessions++;
      gameTypeStats[session.gameType].totalPlaytime += session.duration;
      gameTypeStats[session.gameType].averageScore = 
        (gameTypeStats[session.gameType].averageScore * (gameTypeStats[session.gameType].totalSessions - 1) + 
         (session.score || 0)) / gameTypeStats[session.gameType].totalSessions;
    });

    return {
      totalUsers: users.length,
      totalOrganizations: organizations.length,
      totalSessions: sessions.length,
      totalPlaytime,
      averageSessionDuration,
      topPerformingUsers,
      topPerformingOrganizations,
      gameTypeStats
    };
  } catch (error) {
    console.error('Error getting all stats:', error);
    throw error;
  }
}

// Utility functions for managing organizations
export async function createOrganization(name: string, adminId: string): Promise<string> {
  try {
    const orgData: Omit<Organization, 'id'> = {
      name,
      adminId,
      userIds: [adminId],
      createdAt: new Date().toISOString(),
      totalUsers: 1,
      totalPlaytime: 0,
      totalSessions: 0
    };

    const docRef = await addDoc(collection(db, 'organizations'), orgData);
    
    // Update the admin user's role and organization
    await updateDoc(doc(db, 'users', adminId), {
      role: 'group_admin',
      organizationId: docRef.id,
      organizationName: name
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

export async function addUserToOrganization(userId: string, orgId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Get organization data
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    const orgData = orgDoc.data() as Organization;

    // Update organization
    batch.update(doc(db, 'organizations', orgId), {
      userIds: [...orgData.userIds, userId],
      totalUsers: orgData.totalUsers + 1
    });

    // Update user
    batch.update(doc(db, 'users', userId), {
      organizationId: orgId,
      organizationName: orgData.name
    });

    await batch.commit();
  } catch (error) {
    console.error('Error adding user to organization:', error);
    throw error;
  }
}

// Game session management
export async function createGameSession(sessionData: Omit<GameSession, 'id'>): Promise<string> {
  try {
    // Remove undefined values to prevent Firestore errors
    const cleanedData = Object.entries(sessionData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    const docRef = await addDoc(collection(db, 'gameSessions'), {
      ...cleanedData,
      startedAt: cleanedData.startedAt || new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating game session:', error);
    throw error;
  }
}

export async function updateGameSession(sessionId: string, updates: Partial<GameSession>): Promise<void> {
  try {
    // Remove undefined values to prevent Firestore errors
    const cleanedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    await updateDoc(doc(db, 'gameSessions', sessionId), cleanedUpdates);
  } catch (error) {
    console.error('Error updating game session:', error);
    throw error;
  }
} 
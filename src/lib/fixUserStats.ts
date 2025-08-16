import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserData, GameSession } from '@/types/user';

// Recalculate and fix user stats based on actual session data
export async function fixUserStats(userId: string) {
  try {
    console.log(`🔧 Fixing user stats for: ${userId}`);
    
    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as UserData;
    
    // Get all user's game sessions
    const sessionsQuery = query(
      collection(db, 'gameSessions'),
      where('userId', '==', userId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (GameSession & { id: string })[];
    
    console.log(`📊 Found ${sessions.length} sessions for user ${userId}`);
    
    // Calculate correct stats from sessions
    let totalGamesPlayed = 0;
    let totalCasesCompleted = 0;
    let totalPlaytime = 0;
    let totalScore = 0;
    let validScoreSessions = 0;
    
    const gameTypeStats: { [gameType: string]: { played: number; solved: number; totalScore: number; validSessions: number } } = {};
    
    for (const session of sessions) {
      // Only count sessions that have been properly ended
      if (session.endedAt && session.duration !== undefined && session.duration > 0) {
        totalGamesPlayed++;
        totalPlaytime += session.duration;
        
        if (session.caseSolved) {
          totalCasesCompleted++;
        }
        
        // Only include valid scores in average calculation
        if (session.score !== undefined && session.score > 0) {
          totalScore += session.score;
          validScoreSessions++;
        }
        
        // Track game type stats
        if (!gameTypeStats[session.gameType]) {
          gameTypeStats[session.gameType] = { played: 0, solved: 0, totalScore: 0, validSessions: 0 };
        }
        
        gameTypeStats[session.gameType].played++;
        if (session.caseSolved) {
          gameTypeStats[session.gameType].solved++;
        }
        if (session.score !== undefined && session.score > 0) {
          gameTypeStats[session.gameType].totalScore += session.score;
          gameTypeStats[session.gameType].validSessions++;
        }
      }
    }
    
    // Calculate averages
    const averageScore = validScoreSessions > 0 ? (totalScore / validScoreSessions) : 0;
    
    // Build game type performance object
    const gameTypePerformance: { [gameType: string]: { played: number; solved: number; averageScore: number } } = {};
    
    for (const [gameType, stats] of Object.entries(gameTypeStats)) {
      gameTypePerformance[gameType] = {
        played: stats.played,
        solved: stats.solved,
        averageScore: stats.validSessions > 0 ? (stats.totalScore / stats.validSessions) : 0
      };
    }
    
    // Compare with current user data
    const currentStats = {
      gamesPlayed: userData.gamesPlayed || 0,
      casesCompleted: userData.casesCompleted || 0,
      totalPlaytime: userData.totalPlaytime || 0,
      averageScore: userData.averageScore || 0
    };
    
    const calculatedStats = {
      gamesPlayed: totalGamesPlayed,
      casesCompleted: totalCasesCompleted,
      totalPlaytime: totalPlaytime,
      averageScore: averageScore
    };
    
    console.log(`📈 Current stats:`, currentStats);
    console.log(`🔢 Calculated stats:`, calculatedStats);
    
    // Check if there are discrepancies
    const hasDiscrepancies = 
      currentStats.gamesPlayed !== calculatedStats.gamesPlayed ||
      currentStats.casesCompleted !== calculatedStats.casesCompleted ||
      Math.abs(currentStats.totalPlaytime - calculatedStats.totalPlaytime) > 1 ||
      Math.abs(currentStats.averageScore - calculatedStats.averageScore) > 0.1;
    
    if (hasDiscrepancies) {
      console.log(`🔧 Discrepancies found, updating user stats...`);
      
      // Update user document with correct stats
      const updateData: Partial<UserData> = {
        gamesPlayed: totalGamesPlayed,
        casesCompleted: totalCasesCompleted,
        totalPlaytime: totalPlaytime,
        averageScore: averageScore,
        gameTypePerformance: gameTypePerformance,
        lastUpdated: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'users', userId), updateData);
      
      console.log(`✅ User stats updated successfully`);
      console.log(`📊 New stats: Games=${totalGamesPlayed}, Cases=${totalCasesCompleted}, Playtime=${totalPlaytime}m, AvgScore=${averageScore.toFixed(1)}`);
      
      return {
        fixed: true,
        oldStats: currentStats,
        newStats: calculatedStats,
        gameTypePerformance: gameTypePerformance
      };
    } else {
      console.log(`✅ User stats are already consistent`);
      return {
        fixed: false,
        stats: currentStats,
        gameTypePerformance: gameTypePerformance
      };
    }
    
  } catch (error) {
    console.error('❌ Error fixing user stats:', error);
    throw error;
  }
}

// Fix stats for all users (admin function)
export async function fixAllUserStats() {
  try {
    console.log('🔧 Starting global user stats fix...');
    
    // This would require getting all users - implement if needed
    // For now, we'll focus on individual user fixes
    
    throw new Error('Global stats fix not implemented yet - use individual user fix');
  } catch (error) {
    console.error('❌ Error in global stats fix:', error);
    throw error;
  }
}

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserData, GameSession } from '@/types/user';

export async function debugUserStats(userId: string) {
  try {
    console.log('🔍 Debugging user stats for:', userId);
    
    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data() as UserData;
    
    if (!userData) {
      console.error('❌ User document not found');
      return;
    }
    
    console.log('📊 User document stats:');
    console.log('- Games played:', userData.gamesPlayed || 0);
    console.log('- Cases completed:', userData.casesCompleted || 0);
    console.log('- Total playtime:', userData.totalPlaytime || 0);
    console.log('- Average score:', userData.averageScore || 0);
    
    // Get all game sessions
    const sessionsQuery = query(
      collection(db, 'gameSessions'),
      where('userId', '==', userId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameSession[];
    
    console.log('🎮 Game sessions stats:');
    console.log('- Total sessions:', sessions.length);
    console.log('- Completed sessions:', sessions.filter(s => s.caseSolved).length);
    console.log('- Total duration from sessions:', sessions.reduce((sum, s) => sum + (s.duration || 0), 0));
    
    // Check for inconsistencies
    const sessionStats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.caseSolved).length,
      totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    };
    
    const userDocStats = {
      gamesPlayed: userData.gamesPlayed || 0,
      casesCompleted: userData.casesCompleted || 0,
      totalPlaytime: userData.totalPlaytime || 0
    };
    
    console.log('⚖️ Consistency check:');
    console.log('- Games played match:', sessionStats.totalSessions === userDocStats.gamesPlayed);
    console.log('- Cases completed match:', sessionStats.completedSessions === userDocStats.casesCompleted);
    console.log('- Playtime match:', Math.abs(sessionStats.totalDuration - userDocStats.totalPlaytime) <= 1);
    
    if (sessionStats.totalSessions !== userDocStats.gamesPlayed) {
      console.warn('🔥 INCONSISTENCY: Games played mismatch!');
      console.warn('Sessions:', sessionStats.totalSessions, 'vs User doc:', userDocStats.gamesPlayed);
    }
    
    if (sessionStats.completedSessions !== userDocStats.casesCompleted) {
      console.warn('🔥 INCONSISTENCY: Cases completed mismatch!');
      console.warn('Sessions:', sessionStats.completedSessions, 'vs User doc:', userDocStats.casesCompleted);
    }
    
    if (Math.abs(sessionStats.totalDuration - userDocStats.totalPlaytime) > 1) {
      console.warn('🔥 INCONSISTENCY: Playtime mismatch!');
      console.warn('Sessions:', sessionStats.totalDuration, 'vs User doc:', userDocStats.totalPlaytime);
    }
    
    return {
      userData,
      sessions,
      sessionStats,
      userDocStats,
      isConsistent: {
        gamesPlayed: sessionStats.totalSessions === userDocStats.gamesPlayed,
        casesCompleted: sessionStats.completedSessions === userDocStats.casesCompleted,
        playtime: Math.abs(sessionStats.totalDuration - userDocStats.totalPlaytime) <= 1
      }
    };
    
  } catch (error) {
    console.error('❌ Error debugging user stats:', error);
    throw error;
  }
}

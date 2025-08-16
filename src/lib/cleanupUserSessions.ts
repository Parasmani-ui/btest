import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { GameSession } from '@/types/user';

// Clean up incomplete or duplicate sessions for a user
export async function cleanupUserSessions(userId: string, gameType?: string) {
  try {
    console.log(`🧹 Cleaning up sessions for user: ${userId}, gameType: ${gameType || 'all'}`);
    
    // Query for user's sessions
    let sessionsQuery = query(
      collection(db, 'gameSessions'),
      where('userId', '==', userId)
    );
    
    // Add game type filter if specified
    if (gameType) {
      sessionsQuery = query(
        collection(db, 'gameSessions'),
        where('userId', '==', userId),
        where('gameType', '==', gameType)
      );
    }
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (GameSession & { id: string })[];
    
    console.log(`📊 Found ${sessions.length} sessions for cleanup analysis`);
    
    // Find sessions to clean up
    const now = new Date();
    const sessionsToDelete: string[] = [];
    
    for (const session of sessions) {
      const startTime = new Date(session.startedAt);
      const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Clean up sessions that:
      // 1. Don't have an endedAt timestamp and are older than 2 hours
      // 2. Have duration of 0 and are older than 1 hour
      // 3. Are duplicate sessions (same user, same game type, started within 5 minutes)
      
      if (!session.endedAt && hoursSinceStart > 2) {
        console.log(`🗑️  Marking incomplete session for deletion: ${session.id} (${hoursSinceStart.toFixed(1)}h old)`);
        sessionsToDelete.push(session.id);
      } else if (session.duration === 0 && hoursSinceStart > 1) {
        console.log(`🗑️  Marking zero-duration session for deletion: ${session.id} (${hoursSinceStart.toFixed(1)}h old)`);
        sessionsToDelete.push(session.id);
      }
    }
    
    // Check for duplicate sessions (same game type, within 5 minutes)
    if (gameType) {
      const gameTypeSessions = sessions
        .filter(s => s.gameType === gameType)
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
      
      for (let i = 1; i < gameTypeSessions.length; i++) {
        const current = gameTypeSessions[i];
        const previous = gameTypeSessions[i - 1];
        
        const currentStart = new Date(current.startedAt);
        const previousStart = new Date(previous.startedAt);
        const minutesDiff = (currentStart.getTime() - previousStart.getTime()) / (1000 * 60);
        
        if (minutesDiff < 5 && !sessionsToDelete.includes(current.id)) {
          console.log(`🗑️  Marking duplicate session for deletion: ${current.id} (${minutesDiff.toFixed(1)}min after ${previous.id})`);
          sessionsToDelete.push(current.id);
        }
      }
    }
    
    // Delete marked sessions
    const deletePromises = sessionsToDelete.map(sessionId => 
      deleteDoc(doc(db, 'gameSessions', sessionId))
    );
    
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${deletePromises.length} problematic sessions`);
    } else {
      console.log(`✅ No sessions needed cleanup`);
    }
    
    return {
      totalSessions: sessions.length,
      deletedSessions: sessionsToDelete.length,
      cleanSessions: sessions.length - sessionsToDelete.length
    };
    
  } catch (error) {
    console.error('❌ Error cleaning up user sessions:', error);
    throw error;
  }
}

// Clean up all incomplete sessions across all users (admin function)
export async function cleanupAllOrphanedSessions() {
  try {
    console.log('🧹 Starting global session cleanup...');
    
    // Query for all sessions without endedAt that are older than 2 hours
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));
    
    const sessionsQuery = query(collection(db, 'gameSessions'));
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    const sessionsToDelete: string[] = [];
    let totalSessions = 0;
    
    sessionsSnapshot.docs.forEach(doc => {
      totalSessions++;
      const session = doc.data() as GameSession;
      const startTime = new Date(session.startedAt);
      
      if (!session.endedAt && startTime < twoHoursAgo) {
        sessionsToDelete.push(doc.id);
      }
    });
    
    // Delete orphaned sessions
    const deletePromises = sessionsToDelete.map(sessionId => 
      deleteDoc(doc(db, 'gameSessions', sessionId))
    );
    
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`✅ Global cleanup: Deleted ${deletePromises.length} orphaned sessions out of ${totalSessions} total`);
    } else {
      console.log(`✅ Global cleanup: No orphaned sessions found out of ${totalSessions} total`);
    }
    
    return {
      totalSessions,
      deletedSessions: deletePromises.length
    };
    
  } catch (error) {
    console.error('❌ Error in global session cleanup:', error);
    throw error;
  }
}

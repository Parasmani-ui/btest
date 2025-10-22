import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserData, GameSession } from '@/types/user';

// Validate user stats consistency
export async function validateUserStats(userId: string): Promise<{
  isValid: boolean;
  discrepancies: string[];
  currentStats: any;
  calculatedStats: any;
  gameTypeBreakdown: any;
}> {
  try {
    console.log(`🔍 Validating user stats for: ${userId}`);
    
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
    
    console.log(`📊 Found ${sessions.length} game sessions for user ${userId}`);
    
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
        
        // Count as completed if caseSolved is true OR if score >= 70
        const isCompleted = session.caseSolved === true || (session.score !== undefined && session.score >= 70);
        if (isCompleted) {
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
        if (isCompleted) {
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
    
    // Check for discrepancies
    const discrepancies: string[] = [];
    
    if (currentStats.gamesPlayed !== calculatedStats.gamesPlayed) {
      discrepancies.push(`Games played: ${currentStats.gamesPlayed} vs ${calculatedStats.gamesPlayed}`);
    }
    
    if (currentStats.casesCompleted !== calculatedStats.casesCompleted) {
      discrepancies.push(`Cases completed: ${currentStats.casesCompleted} vs ${calculatedStats.casesCompleted}`);
    }
    
    if (Math.abs(currentStats.totalPlaytime - calculatedStats.totalPlaytime) > 1) {
      discrepancies.push(`Total playtime: ${currentStats.totalPlaytime}m vs ${calculatedStats.totalPlaytime}m`);
    }
    
    if (Math.abs(currentStats.averageScore - calculatedStats.averageScore) > 0.1) {
      discrepancies.push(`Average score: ${currentStats.averageScore.toFixed(1)} vs ${calculatedStats.averageScore.toFixed(1)}`);
    }
    
    // Check game type performance discrepancies
    const currentGameTypePerformance = userData.gameTypePerformance || {};
    for (const [gameType, calculatedStats] of Object.entries(gameTypePerformance)) {
      const currentStats = currentGameTypePerformance[gameType];
      if (currentStats) {
        if (currentStats.played !== calculatedStats.played) {
          discrepancies.push(`${gameType} played: ${currentStats.played} vs ${calculatedStats.played}`);
        }
        if (currentStats.solved !== calculatedStats.solved) {
          discrepancies.push(`${gameType} solved: ${currentStats.solved} vs ${calculatedStats.solved}`);
        }
        if (Math.abs(currentStats.averageScore - calculatedStats.averageScore) > 0.1) {
          discrepancies.push(`${gameType} avg score: ${currentStats.averageScore.toFixed(1)} vs ${calculatedStats.averageScore.toFixed(1)}`);
        }
      } else if (calculatedStats.played > 0) {
        discrepancies.push(`${gameType} missing from gameTypePerformance but has ${calculatedStats.played} sessions`);
      }
    }
    
    const isValid = discrepancies.length === 0;
    
    console.log(`📈 Current stats:`, currentStats);
    console.log(`🔢 Calculated stats:`, calculatedStats);
    console.log(`🎯 Game type breakdown:`, gameTypePerformance);
    
    if (discrepancies.length > 0) {
      console.log(`⚠️  Found ${discrepancies.length} discrepancies:`, discrepancies);
    } else {
      console.log(`✅ User stats are consistent`);
    }
    
    return {
      isValid,
      discrepancies,
      currentStats,
      calculatedStats,
      gameTypeBreakdown: gameTypePerformance
    };
    
  } catch (error) {
    console.error('❌ Error validating user stats:', error);
    throw error;
  }
}

// Validate all users' stats
export async function validateAllUserStats(): Promise<{
  totalUsers: number;
  validUsers: number;
  invalidUsers: number;
  userDiscrepancies: { userId: string; discrepancies: string[] }[];
}> {
  try {
    console.log('🔍 Starting global user stats validation...');
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`👥 Found ${users.length} users to validate`);
    
    let validUsers = 0;
    let invalidUsers = 0;
    const userDiscrepancies: { userId: string; discrepancies: string[] }[] = [];
    
    for (const user of users) {
      try {
        console.log(`\n🔄 Validating user: ${user.displayName || user.email || user.id}`);
        const validation = await validateUserStats(user.id);
        
        if (validation.isValid) {
          validUsers++;
          console.log(`✅ Stats valid for ${user.displayName || user.email || user.id}`);
        } else {
          invalidUsers++;
          userDiscrepancies.push({
            userId: user.id,
            discrepancies: validation.discrepancies
          });
          console.log(`❌ Stats invalid for ${user.displayName || user.email || user.id}: ${validation.discrepancies.length} discrepancies`);
        }
      } catch (error) {
        console.error(`❌ Error validating user ${user.displayName || user.email || user.id}:`, error);
        invalidUsers++;
        userDiscrepancies.push({
          userId: user.id,
          discrepancies: [`Validation error: ${error}`]
        });
      }
    }
    
    console.log('\n🎉 Global validation completed!');
    console.log('📊 Summary:');
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Valid users: ${validUsers}`);
    console.log(`   - Invalid users: ${invalidUsers}`);
    
    if (userDiscrepancies.length > 0) {
      console.log('\n⚠️  Users with discrepancies:');
      userDiscrepancies.forEach(({ userId, discrepancies }) => {
        console.log(`   - ${userId}: ${discrepancies.join(', ')}`);
      });
    }
    
    return {
      totalUsers: users.length,
      validUsers,
      invalidUsers,
      userDiscrepancies
    };
    
  } catch (error) {
    console.error('❌ Error in global validation:', error);
    throw error;
  }
}

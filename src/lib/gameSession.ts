import { useAuth } from '@/contexts/AuthContext';
import { createGameSession, updateGameSession, updateUserStatsAfterGame, updateUserStatsOnGameStart } from '@/lib/firestore';
import { GameSession } from '@/types/user';

// Game session manager class
export class GameSessionManager {
  private static instance: GameSessionManager;
  private currentSession: string | null = null;
  private startTime: Date | null = null;
  private gameType: string | null = null;
  private userId: string | null = null;
  private organizationId: string | null | undefined = null;
  private isCreatingSession: boolean = false; // Lock to prevent duplicate creation

  private constructor() {}

  static getInstance(): GameSessionManager {
    if (!GameSessionManager.instance) {
      GameSessionManager.instance = new GameSessionManager();
    }
    return GameSessionManager.instance;
  }

  // Start a new game session
  async startSession(
    gameType: 'quick' | 'simulation' | 'hospital' | 'fake-news' | 'chainfail' | 'forensic-audit' | 'food-safety' | 'negotiation' | 'financial-negotiation',
    userId: string,
    organizationId?: string | null
  ): Promise<string> {
    try {
      // Prevent duplicate session creation
      if (this.isCreatingSession) {
        console.log(`⏳ Session creation already in progress, skipping duplicate call`);
        // Wait for the current session creation to complete
        while (this.isCreatingSession) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (this.currentSession) {
          console.log(`✅ Returning existing session: ${this.currentSession}`);
          return this.currentSession;
        }
      }

      // If session already exists for this game type, return it
      if (this.currentSession && this.gameType === gameType && this.userId === userId) {
        console.log(`✅ Session already exists: ${this.currentSession}`);
        return this.currentSession;
      }

      this.isCreatingSession = true;
      console.log(`🎮 Starting new game session: ${gameType} for user ${userId}`);

      // End any existing session first
      if (this.currentSession) {
        console.log(`⚠️  Ending existing session: ${this.currentSession}`);
        await this.endSession(false, 0);
      }

      this.startTime = new Date();
      this.gameType = gameType;
      this.userId = userId;
      this.organizationId = organizationId || null;

      // Create the session in Firestore
      const sessionData: Omit<GameSession, 'id'> = {
        userId,
        organizationId,
        gameType,
        startedAt: this.startTime.toISOString(),
        duration: 0, // Will be calculated when session ends
        caseSolved: false,
        score: 0,
        evidence: [],
        actions: [],
        hints: 0,
        timeSpent: 0
      };

      this.currentSession = await createGameSession(sessionData);
      console.log(`✅ Game session started successfully: ${this.currentSession} for ${gameType}`);

      return this.currentSession;
    } catch (error) {
      console.error('❌ Error starting game session:', error);
      // Reset state on error
      this.currentSession = null;
      this.startTime = null;
      this.gameType = null;
      this.userId = null;
      this.organizationId = null;
      throw error;
    } finally {
      this.isCreatingSession = false;
    }
  }

  // Update session with evidence or actions
  async updateSession(updates: {
    evidence?: string[];
    actions?: string[];
    hints?: number;
    score?: number;
    analysis?: string;
    caseTitle?: string;
    scoreBreakdown?: any;
    userDecisions?: any;
    correctAnswer?: string;
    userAnswer?: string;
  }): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active session to update');
      return;
    }

    try {
      const timeSpent = this.getTimeSpent();
      await updateGameSession(this.currentSession, {
        ...updates,
        timeSpent
      });
    } catch (error) {
      console.error('Error updating game session:', error);
    }
  }

  // End the current session
  async endSession(caseSolved: boolean = false, finalScore: number = 0): Promise<void> {
    if (!this.currentSession || !this.startTime) {
      console.warn('⚠️  No active session to end');
      return;
    }

    const sessionId = this.currentSession;
    const gameType = this.gameType;
    const userId = this.userId;

    try {
      console.log(`🏁 Ending game session: ${sessionId}, solved: ${caseSolved}, score: ${finalScore}`);
      
      const endTime = new Date();
      const durationMs = endTime.getTime() - this.startTime.getTime();
      const duration = Math.max(1, Math.round(durationMs / 1000 / 60)); // Minimum 1 minute, round to nearest minute
      const timeSpent = this.getTimeSpent();

      console.log(`⏱️  Session duration calculation: startTime=${this.startTime.toISOString()}, endTime=${endTime.toISOString()}, durationMs=${durationMs}, duration=${duration}m`);

      await updateGameSession(sessionId, {
        endedAt: endTime.toISOString(),
        duration,
        caseSolved,
        score: finalScore,
        timeSpent
      });

      console.log(`✅ Session data updated: ${sessionId}, Duration: ${duration}m, Score: ${finalScore}`);

      // Update user stats after successful game session
      if (userId && gameType) {
        console.log(`📊 Updating user stats for: ${userId}, game: ${gameType}`);
        await updateUserStatsAfterGame(userId, gameType, caseSolved, finalScore, duration);
        console.log(`✅ User stats updated successfully`);
      }

      console.log(`🎯 Game session completed successfully: ${sessionId}`);
    } catch (error) {
      console.error('❌ Error ending game session:', error);
      // Don't throw error here, as we still want to reset session data
    } finally {
      // Always reset session data, even if there was an error
      console.log(`🧹 Cleaning up session data for: ${sessionId}`);
      this.currentSession = null;
      this.startTime = null;
      this.gameType = null;
      this.userId = null;
      this.organizationId = null;
    }
  }

  // Get current session time in minutes
  getTimeSpent(): number {
    if (!this.startTime) return 0;
    return Math.round((new Date().getTime() - this.startTime.getTime()) / 1000 / 60);
  }

  // Get current session info
  getCurrentSession(): {
    sessionId: string | null;
    gameType: string | null;
    timeSpent: number;
    isActive: boolean;
    startTime: Date | null;
  } {
    return {
      sessionId: this.currentSession,
      gameType: this.gameType,
      timeSpent: this.getTimeSpent(),
      isActive: this.currentSession !== null,
      startTime: this.startTime
    };
  }

  // Add evidence to current session
  async addEvidence(evidence: string): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Get current evidence and add new one
      const currentEvidence = await this.getCurrentEvidence();
      const updatedEvidence = [...currentEvidence, evidence];
      
      await this.updateSession({ evidence: updatedEvidence });
    } catch (error) {
      console.error('Error adding evidence:', error);
    }
  }

  // Add action to current session
  async addAction(action: string): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Get current actions and add new one
      const currentActions = await this.getCurrentActions();
      const updatedActions = [...currentActions, action];
      
      await this.updateSession({ actions: updatedActions });
    } catch (error) {
      console.error('Error adding action:', error);
    }
  }

  // Increment hints used
  async incrementHints(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const currentHints = await this.getCurrentHints();
      await this.updateSession({ hints: currentHints + 1 });
    } catch (error) {
      console.error('Error incrementing hints:', error);
    }
  }

  // Helper methods to get current session data
  private async getCurrentEvidence(): Promise<string[]> {
    // In a real implementation, you might want to fetch this from Firestore
    // For now, return empty array as evidence will be tracked incrementally
    return [];
  }

  private async getCurrentActions(): Promise<string[]> {
    // In a real implementation, you might want to fetch this from Firestore
    return [];
  }

  private async getCurrentHints(): Promise<number> {
    // In a real implementation, you might want to fetch this from Firestore
    return 0;
  }
}

// React hook for game session management
export function useGameSession() {
  const { userData, refreshUserData } = useAuth();
  const sessionManager = GameSessionManager.getInstance();

  const startSession = async (gameType: 'quick' | 'simulation' | 'hospital' | 'fake-news' | 'chainfail' | 'forensic-audit' | 'food-safety' | 'negotiation' | 'financial-negotiation') => {
    if (!userData?.uid) {
      throw new Error('User not authenticated');
    }
    return await sessionManager.startSession(gameType, userData.uid, userData.organizationId);
  };

  const endSession = async (caseSolved: boolean = false, finalScore: number = 0) => {
    await sessionManager.endSession(caseSolved, finalScore);
  };

  const updateSession = async (updates: {
    evidence?: string[];
    actions?: string[];
    hints?: number;
    score?: number;
    analysis?: string;
    caseTitle?: string;
    scoreBreakdown?: any;
    userDecisions?: any;
    correctAnswer?: string;
    userAnswer?: string;
  }) => {
    await sessionManager.updateSession(updates);
  };

  const addEvidence = async (evidence: string) => {
    await sessionManager.addEvidence(evidence);
  };

  const addAction = async (action: string) => {
    await sessionManager.addAction(action);
  };

  const incrementHints = async () => {
    await sessionManager.incrementHints();
  };

  const getCurrentSession = () => sessionManager.getCurrentSession();

  const handleGameEnd = async (caseSolved: boolean = false, finalScore: number = 0) => {
    try {
      await sessionManager.endSession(caseSolved, finalScore);
      console.log('Game ended and user stats updated successfully');
      
      // Refresh user data to reflect the latest stats
      await refreshUserData();
      console.log('✅ User data refreshed after game completion');
    } catch (error) {
      console.error('Error ending game session:', error);
      throw error;
    }
  };

  return {
    startSession,
    endSession,
    updateSession,
    addEvidence,
    addAction,
    incrementHints,
    getCurrentSession,
    handleGameEnd
  };
}

// Standalone utility function for ending games (can be used outside React components)
export async function handleGameEnd(caseSolved: boolean = false, finalScore: number = 0): Promise<void> {
  try {
    const sessionManager = GameSessionManager.getInstance();
    await sessionManager.endSession(caseSolved, finalScore);
    console.log('Game ended and user stats updated successfully');
  } catch (error) {
    console.error('Error ending game session:', error);
    throw error;
  }
} 
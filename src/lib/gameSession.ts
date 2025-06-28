import { useAuth } from '@/contexts/AuthContext';
import { createGameSession, updateGameSession } from '@/lib/firestore';
import { GameSession } from '@/types/user';

// Game session manager class
export class GameSessionManager {
  private static instance: GameSessionManager;
  private currentSession: string | null = null;
  private startTime: Date | null = null;
  private gameType: string | null = null;
  private userId: string | null = null;
  private organizationId: string | null | undefined = null;

  private constructor() {}

  static getInstance(): GameSessionManager {
    if (!GameSessionManager.instance) {
      GameSessionManager.instance = new GameSessionManager();
    }
    return GameSessionManager.instance;
  }

  // Start a new game session
  async startSession(
    gameType: 'quick' | 'simulation' | 'hospital' | 'fake-news' | 'chainfail',
    userId: string,
    organizationId?: string | null
  ): Promise<string> {
    try {
      // End any existing session first
      if (this.currentSession) {
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
      console.log(`Game session started: ${this.currentSession} for ${gameType}`);
      return this.currentSession;
    } catch (error) {
      console.error('Error starting game session:', error);
      throw error;
    }
  }

  // Update session with evidence or actions
  async updateSession(updates: {
    evidence?: string[];
    actions?: string[];
    hints?: number;
    score?: number;
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
      console.warn('No active session to end');
      return;
    }

    try {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - this.startTime.getTime()) / 1000 / 60); // Duration in minutes
      const timeSpent = this.getTimeSpent();

      await updateGameSession(this.currentSession, {
        endedAt: endTime.toISOString(),
        duration,
        caseSolved,
        score: finalScore,
        timeSpent
      });

      console.log(`Game session ended: ${this.currentSession}, Duration: ${duration}m, Score: ${finalScore}`);

      // Reset session data
      this.currentSession = null;
      this.startTime = null;
      this.gameType = null;
      this.userId = null;
      this.organizationId = null;
    } catch (error) {
      console.error('Error ending game session:', error);
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
  const { userData } = useAuth();
  const sessionManager = GameSessionManager.getInstance();

  const startSession = async (gameType: 'quick' | 'simulation' | 'hospital' | 'fake-news' | 'chainfail') => {
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

  return {
    startSession,
    endSession,
    updateSession,
    addEvidence,
    addAction,
    incrementHints,
    getCurrentSession
  };
} 
import { ChatOpenAI } from '@langchain/openai';
import { Config } from '@/config/config';

// helper function with randonm suspect generate
export function generateRandomSuspect() {
  const firstNames = [
    'James', 'John', 'Robert', 'Michael', 'William',
    'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth',
    'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson',
    'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez',
    'Moore', 'Martin', 'Jackson', 'Thompson', 'White'
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}

// interrogation of suspect
export async function interrogateSuspect(suspectName: string, caseDetails: string, murderer: string) {
  const llm = new ChatOpenAI({
    // modelName: "gpt-4o-mini", 
    modelName: "gpt-4.1",
    temperature: 0.7, 
    openAIApiKey: Config.OPENAI_API_KEY,
    maxRetries: 2,
    timeout: 25000 // 25 second timeout
  });
  
  // Truncate case details if too long to improve response time
  const truncatedCaseDetails = caseDetails.length > 2000 
    ? caseDetails.substring(0, 2000) + "..." 
    : caseDetails;
  
  const prompt = `
  You are the suspect, **${suspectName}**, in an ongoing investigation.
  The detective is questioning you based on this case:

  **CASE DETAILS:**
  ${truncatedCaseDetails}

  Provide your response in two parts:

  1. INVESTIGATION SUGGESTIONS:
  Suggest what evidence the detective should examine and why. This should be based on your knowledge of the case.

  2. SUSPECT STATEMENT:
  Give your actual statement as the suspect. This should be a direct response to the detective's questions, reflecting your knowledge, emotions, and possible involvement in the case. 
  If you are the murderer (which is: ${murderer}), be evasive but don't confess.
  If you're innocent, behave naturally but you might have your own secrets too.

  Format your response exactly as follows:

  INVESTIGATION SUGGESTIONS:
  [Your suggestions about what evidence to examine]

  SUSPECT STATEMENT:
  [Your actual statement as the suspect]
  `;
  
  return await llm.predict(prompt);
}

// evidence analysis
export async function analyzeEvidence(evidenceItem: string, caseDetails: string, murderer: string) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini", 
    temperature: 0.7, 
    openAIApiKey: Config.OPENAI_API_KEY,
    maxRetries: 2,
    timeout: 25000 // 25 second timeout
  });
  
  // Truncate case details if too long to improve response time
  const truncatedCaseDetails = caseDetails.length > 2000 
    ? caseDetails.substring(0, 2000) + "..." 
    : caseDetails;
  
  const prompt = `
  You are a forensic analyst reviewing this specific piece of evidence: **${evidenceItem}**.

  **CASE DETAILS:**
  ${truncatedCaseDetails}

  Provide a very short analysis of ONLY this specific evidence item. Focus on:
  1. Physical characteristics and condition
  2. Potential significance to the case
  3. How it might connect to the crime
  4. What it reveals about the murder method
  5. Any potential leads it provides

  If this evidence connects to the murderer (${murderer}), include subtle clues but never directly reveal the murderer.
  Keep the analysis focused only on this specific evidence item.
  `;
  
  return await llm.predict(prompt);
}

// get hint
export async function getDetectiveHint(caseDetails: string, murderer: string) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini", 
    temperature: 0.7, 
    openAIApiKey: Config.OPENAI_API_KEY,
    maxRetries: 2,
    timeout: 25000 // 25 second timeout
  });
  
  // Truncate case details if too long to improve response time
  const truncatedCaseDetails = caseDetails.length > 2000 
    ? caseDetails.substring(0, 2000) + "..." 
    : caseDetails;
  
  const prompt = `
  You are a detective's assistant providing a helpful hint for a murder mystery.
  
  Current case details:
  ${truncatedCaseDetails}
  
  The real murderer is: ${murderer}
  
  Provide a subtle hint that guides the detective toward the truth without directly revealing the murderer.
  The hint should be a single sentence of advice or observation.
  `;
  
  return await llm.predict(prompt);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Game session helper for integrating with existing game flows
export async function endGameSession(options: {
  caseSolved: boolean;
  finalScore: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}): Promise<void> {
  try {
    // Import dynamically to avoid circular dependencies
    const { handleGameEnd } = await import('@/lib/gameSession');
    await handleGameEnd(options.caseSolved, options.finalScore);
    
    if (options.onSuccess) {
      options.onSuccess();
    }
  } catch (error) {
    console.error('Failed to end game session:', error);
    if (options.onError) {
      options.onError(error as Error);
    }
  }
}

// Complete integration template for game components - UPDATED VERSION
export const GameSessionIntegration = {
  // Add to component imports:
  imports: `
import { useGameSession } from '@/lib/gameSession';
  `,
  
  // Add to component state:
  hooks: `
const { startSession } = useGameSession();
  `,
  
  // Add to game start function:
  startGame: (gameType: 'quick' | 'simulation' | 'hospital' | 'fake-news' | 'chainfail' | 'forensic-audit' | 'food-safety') => `
// Start game session tracking
try {
  await startSession('${gameType}');
  console.log('✅ Game session started for ${gameType}');
} catch (error) {
  console.error('❌ Error starting game session:', error);
}
  `,
  
  // Add to game end logic:
  endGame: `
// Update user stats when game ends
if (gameEnded) {
  try {
    // Calculate total score (adjust based on your scoring system)
    const totalScore = scores ? 
      ((scores.score1 + scores.score2) / maxPossibleScore) * 100 : 50;
    
    // Determine if case was solved (adjust based on your win condition)
    const caseSolved = finalVerdict === 'success' || totalScore >= 70;
    
    await handleGameEnd(caseSolved, totalScore);
    console.log('✅ User stats updated successfully');
  } catch (error) {
    console.error('❌ Error updating user stats:', error);
  }
}
  `,
  
  // Integration examples for different game types:
  examples: {
    'fake-news': `
// Example for fake-news simulation
const totalScore = analysis?.overall_score || 50;
const caseSolved = analysis?.analysis_type === 'final_judgment' && totalScore >= 70;
await handleGameEnd(caseSolved, totalScore);
    `,
    
    'chainfail': `
// Example for chainfail simulation  
const totalScore = analysis?.overall_score || 50;
const caseSolved = analysis?.analysis_type === 'final_judgment' && totalScore >= 70;
await handleGameEnd(caseSolved, totalScore);
    `,
    
    'hospital': `
// Example for hospital simulation
const totalScore = finalData?.effectiveness_score || 50;
const caseSolved = finalData?.crisis_resolved === true;
await handleGameEnd(caseSolved, totalScore);
    `,
    
    'forensic-audit': `
// Example for forensic audit
const totalScore = auditResults?.accuracy_score || 50;
const caseSolved = auditResults?.audit_passed === true;
await handleGameEnd(caseSolved, totalScore);
    `,
    
    'quick': `
// Example for quick game
const totalScore = gameResults?.score || 50;
const caseSolved = gameResults?.solved === true;
await handleGameEnd(caseSolved, totalScore);
    `,
    
    'simulation': `
// Example for complex simulation
const totalScore = simulationResults?.overall_score || 50;
const caseSolved = simulationResults?.case_solved === true;
await handleGameEnd(caseSolved, totalScore);
    `
  }
};

// Quick setup function for game components
export async function setupGameSession(gameType: 'quick' | 'simulation' | 'hospital' | 'fake-news' | 'chainfail' | 'forensic-audit' | 'food-safety') {
  try {
    const { useGameSession } = await import('@/lib/gameSession');
    return useGameSession();
  } catch (error) {
    console.error('Error setting up game session:', error);
    return null;
  }
}

// Calculate score from different game formats
export function calculateGameScore(scores: any, gameType: string): number {
  switch (gameType) {
    case 'food-safety':
      return scores?.insightfulness && scores?.evidenceEvaluation 
        ? ((scores.insightfulness + scores.evidenceEvaluation) / 10) * 100 
        : 50;
    
    case 'forensic-audit':
      return scores?.accuracy && scores?.thoroughness 
        ? ((scores.accuracy + scores.thoroughness) / 10) * 100 
        : 50;
    
    case 'hospital':
      return scores?.decisionQuality && scores?.timeManagement 
        ? ((scores.decisionQuality + scores.timeManagement) / 10) * 100 
        : 50;
    
    default:
      return scores?.overall || scores?.total || 50;
  }
}

// Determine if case was solved based on game type
export function determineCaseSolved(verdict: any, scores: any, gameType: string): boolean {
  switch (gameType) {
    case 'food-safety':
      return verdict === 'ban_lifted';
    
    case 'forensic-audit':
      return verdict === 'fraud_detected' || (scores && (scores.accuracy + scores.thoroughness) >= 8);
    
    case 'hospital':
      return verdict === 'crisis_resolved' || (scores && (scores.decisionQuality + scores.timeManagement) >= 8);
    
    default:
      return verdict === 'success' || verdict === 'solved';
  }
} 
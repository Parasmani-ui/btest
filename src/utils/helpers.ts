import { ChatOpenAI } from '@langchain/openai';
import { Config } from '@/config/config';

// Helper function that generates random suspects
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

// interrogate suspects
export async function interrogateSuspect(suspectName: string, caseDetails: string, murderer: string) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini", 
    temperature: 0.7, 
    openAIApiKey: Config.OPENAI_API_KEY
  });
  
  const prompt = `
  You are the suspect, **${suspectName}**, in an ongoing investigation.
  The detective is questioning you based on this case:

  **CASE DETAILS:**
  ${caseDetails}

  Answer in a way that reflects your knowledge, emotions, and possible involvement in the case. 
  If you are the murderer (which is: ${murderer}), be evasive but don't confess.
  If you're innocent, behave naturally but you might have your own secrets too.
  `;
  
  return await llm.predict(prompt);
}

// evidence analysis
export async function analyzeEvidence(evidenceItem: string, caseDetails: string, murderer: string) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini", 
    temperature: 0.7, 
    openAIApiKey: Config.OPENAI_API_KEY
  });
  
  const prompt = `
  You are a forensic analyst reviewing the evidence: **${evidenceItem}**.

  **CASE DETAILS:**
  ${caseDetails}

  Provide insights about the evidence. If this evidence connects to the murderer (${murderer}),
  include subtle clues but never directly reveal the murderer.
  `;
  
  return await llm.predict(prompt);
}

// get hints
export async function getDetectiveHint(caseDetails: string, murderer: string) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini", 
    temperature: 0.7, 
    openAIApiKey: Config.OPENAI_API_KEY
  });
  
  const prompt = `
  You are a detective's assistant providing a helpful hint for a murder mystery.
  
  Current case details:
  ${caseDetails}
  
  The real murderer is: ${murderer}
  
  Provide a subtle hint that guides the detective toward the truth without directly revealing the murderer.
  The hint should be a single sentence of advice or observation.
  `;
  
  return await llm.predict(prompt);
} 
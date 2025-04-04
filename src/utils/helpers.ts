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
    modelName: "gpt-4o-mini", 
    temperature: 0.7, 
    openAIApiKey: Config.OPENAI_API_KEY
  });
  
  const prompt = `
  You are the suspect, **${suspectName}**, in an ongoing investigation.
  The detective is questioning you based on this case:

  **CASE DETAILS:**
  ${caseDetails}

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
    openAIApiKey: Config.OPENAI_API_KEY
  });
  
  const prompt = `
  You are a forensic analyst reviewing this specific piece of evidence: **${evidenceItem}**.

  **CASE DETAILS:**
  ${caseDetails}

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
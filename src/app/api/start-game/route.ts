import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { Config } from '@/config/config';
import { QUICK_MODE_PROMPT, STANDARD_MODE_PROMPT, COMPLEX_MODE_PROMPT } from '@/utils/prompts';
import { generateRandomSuspect } from '@/utils/helpers';

// Game state
declare global {
  let gameState: {
    started: boolean;
    mode: string | null;
    caseDetails: string | null;
    suspects: string[];
    evidence: string[];
    murderer: string | null;
    actions: string[];
  };
}

// Initialize global game state if not already done
if (!global.gameState) {
  global.gameState = {
    started: false,
    mode: null,
    caseDetails: null,
    suspects: [],
    evidence: [],
    murderer: null,
    actions: []
  };
}

function cleanText(text: string): string {
  // remove unnecessary new line and charactes
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .trim();
}

async function generateUniqueCase(mode: string) {
  const timestamp = new Date().toISOString();
  const seedValue = Math.floor(Math.random() * 9000000) + 1000000;

  const prompts: Record<string, string> = {
    "quick": QUICK_MODE_PROMPT,
    "standard": STANDARD_MODE_PROMPT, 
    "complex": COMPLEX_MODE_PROMPT
  };
  
  const casePrompt = prompts[mode] || QUICK_MODE_PROMPT;
  
  // Generate AI response
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini", 
    temperature: 0.7, 
    openAIApiKey: Config.OPENAI_API_KEY
  });
  
  const response = await llm.predict(`${casePrompt}\nUse timestamp ${timestamp} and hidden randomness factor ${seedValue}.`);
  
  return cleanText(response);
}

function extractSuspectsAndEvidence(caseDetails: string) {
  const suspects: string[] = [];
  const evidence: string[] = [];
  
  const lines = caseDetails.split('\n');
  let inSuspectSection = false;
  let inEvidenceSection = false;
  
  for (let line of lines) {
    line = line.trim();
    
    // check section headers
    if (line.toUpperCase().includes('SUSPECTS:') || line.toUpperCase().includes('SUSPECT LIST:')) {
      inSuspectSection = true;
      inEvidenceSection = false;
      continue;
    }
    if (line.toUpperCase().includes('EVIDENCE:') || line.toUpperCase().includes('EVIDENCE LIST:')) {
      inSuspectSection = false;
      inEvidenceSection = true;
      continue;
    }
    
    // extract suspects
    if (inSuspectSection && line && !line.includes('[Button:') && !line.includes('WHAT WOULD YOU LIKE TO DO')) {
      const suspectMatch = line.match(/(?:\d+\.\s*)?([^-\n]+)(?:\s*-.*)?/);
      if (suspectMatch && suspectMatch[1]) {
        const suspect = suspectMatch[1].trim();
        if (suspect && !suspects.includes(suspect) && !suspect.toUpperCase().includes('SUSPECTS')) {
          suspects.push(suspect);
        }
      }
    }
    
    // evidence extract
    if (inEvidenceSection && line && !line.includes('[Button:') && !line.includes('WHAT WOULD YOU LIKE TO DO')) {
      const evidenceMatch = line.match(/(?:[-•*]\s*|(?:\d+\.\s*))?([^:]+)(?:\s*:.*)?/);
      if (evidenceMatch && evidenceMatch[1]) {
        const evidenceItem = evidenceMatch[1].trim();
        if (evidenceItem && 
            !evidence.includes(evidenceItem) && 
            !evidenceItem.toUpperCase().includes('EVIDENCE') &&
            !evidenceItem.toUpperCase().includes('INITIAL REPORT') &&
            !evidenceItem.includes('At approximately') &&
            !evidenceItem.includes('WHAT WOULD YOU LIKE TO DO')) {
          evidence.push(evidenceItem);
        }
      }
    }
  }
  
  return { 
    suspects: suspects.filter(s => s), 
    evidence: evidence.filter(e => e) 
  };
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const mode = data.mode || 'quick';
    
    // Reset game state
    global.gameState.started = true;
    global.gameState.mode = mode;
    global.gameState.actions = [];
    
    // Generate case
    global.gameState.caseDetails = await generateUniqueCase(mode);
    
    // Extract suspects and evidence
    const { suspects, evidence } = extractSuspectsAndEvidence(global.gameState.caseDetails);
    
    // Validate extracted data
    if (suspects.length === 0 || evidence.length === 0) {
      console.error('Failed to extract suspects or evidence from case:', global.gameState.caseDetails);
      return NextResponse.json({ error: 'Invalid case generated' }, { status: 500 });
    }
    
    global.gameState.suspects = suspects;
    global.gameState.evidence = evidence;
    
    // Secretly select a murderer
    if (suspects.length > 0) {
      global.gameState.murderer = suspects[Math.floor(Math.random() * suspects.length)];
    } else {
      global.gameState.murderer = "Unknown";  // Fallback
    }
    
    return NextResponse.json({
      success: true,
      caseDetails: global.gameState.caseDetails,
      suspects: global.gameState.suspects,
      evidence: global.gameState.evidence
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
} 
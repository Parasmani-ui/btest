import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SimulationData, ResponsibleParty, MisconductType, PrimaryMotivation } from '@/types/simulation';
import { POSH_TRAINING_SIMULATION_PROMPT } from '@/utils/prompts';
import fs from 'fs';
import path from 'path';

export const maxDuration = 120; // Increased from 60 to 120 seconds for longer generation time

// Basic template for creating a new simulation if all else fails
const EMPTY_TEMPLATE: SimulationData = {
  caseOverview: "Workplace Harassment Allegation: Messaging Platform Incident\n\nCase Overview: Priya Sharma, a software developer at TechSolutions Inc., has filed a formal complaint against her team leader, Rahul Verma. She alleges that Rahul has been sending her inappropriate messages through the company's internal messaging platform for the past three months. The messages allegedly contain unwelcome personal comments about her appearance and requests to meet outside work hours. Priya claims these messages have created a hostile work environment, affecting her job performance and mental well-being. Rahul denies any inappropriate intent, stating his messages were friendly and part of normal team communication.",
  
  complainantStatement: "Statement of Priya Sharma (Complainant):\n\nI joined TechSolutions Inc. as a Senior Developer eight months ago and was assigned to the Cloud Services team led by Rahul Verma. Initially, our professional relationship was normal and respectful. About three months ago, Rahul began sending me direct messages on our company's communication platform that made me uncomfortable.\n\nThese messages started with comments about my appearance during video calls ('You look nice today', 'That color suits you'). While these could be considered innocuous, they gradually escalated to more personal comments and questions about my personal life. He frequently asked if I was single and suggested we should 'get to know each other better outside office hours.'\n\nWhen I would not respond or would change the subject, he would send multiple follow-up messages. On several occasions, he messaged me late at night on weekends with non-work-related content. I have documented these messages and saved screenshots.\n\nI attempted to keep our interactions strictly professional and clearly stated that I wanted to focus on work-related matters only. Despite this, the unwanted messages continued. This situation has created significant stress and anxiety for me. I find myself dreading team meetings and avoiding direct communication with him.\n\nI am filing this complaint because this behavior constitutes harassment and has created a hostile work environment that is affecting my job performance and mental well-being.",
  
  respondentStatement: "Statement of Rahul Verma (Respondent):\n\nI have been a Team Leader at TechSolutions Inc. for four years with an exemplary record of team management. Priya Sharma joined my team eight months ago, and I have maintained a professional relationship with her throughout this period.\n\nI categorically deny any allegations of harassment or inappropriate behavior. As a team leader, I believe in creating a friendly and positive atmosphere within my team. My communications with Priya, as with all team members, have always been cordial and respectful.\n\nThe messages in question were sent with purely professional intentions or as friendly workplace banter. Comments about appearance were meant as casual compliments that I would extend to any team member, regardless of gender. They were never intended to make her uncomfortable.\n\nRegarding messages outside work hours, our team often handles critical projects with tight deadlines, necessitating communication beyond regular hours. I have never insisted on meeting outside of work in a personal capacity.\n\nI believe there has been a misunderstanding or misinterpretation of my intentions. I respect all my colleagues and would never intentionally create a hostile work environment. I am willing to adjust my communication style to ensure team comfort and am committed to maintaining a professional environment.",
  
  additionalEvidence: "Evidence and Witness Statements:\n\n1. Message Screenshots:\nScreenshots of 17 direct messages sent by Rahul to Priya over the three-month period show a pattern of increasingly personal comments and requests to meet outside work hours. Messages sent after 10 PM on weekends were highlighted.\n\n2. Company Communication Policy:\nTechSolutions Inc. Communication Policy (Section 4.2) states: \"All workplace communication must maintain professional boundaries and respect personal space of colleagues.\"\n\nWitness 1 - Anjali Mathur (HR Manager):\nI received Priya's initial verbal complaint three weeks ago. She appeared visibly distressed during our meeting and showed me several screenshots of messages from Rahul that contained personal comments and suggestions to meet outside work. I advised her on the formal complaint process and initiated a preliminary investigation. During this process, I interviewed several team members who confirmed noticing tension between Priya and Rahul during recent team meetings.\n\nWitness 2 - Vikram Singh (Team Member):\nI have worked on the Cloud Services team with both Priya and Rahul for the past eight months. I noticed that Rahul's communication style with Priya seemed different than with other team members. During video calls, he would often compliment her appearance, which I didn't observe him doing with other team members. I also noticed that Priya became increasingly withdrawn in team meetings over the past couple of months, speaking less and turning her camera off more frequently.\n\nWitness 3 - Deepak Patel (IT Administrator):\nAs the IT administrator responsible for our messaging platform, I was asked by HR to verify the authenticity of the message screenshots provided by Priya. I can confirm that the messages are genuine and were sent from Rahul's account to Priya's account on the dates and times indicated in the evidence. Our system logs show that there were 42 direct messages sent from Rahul to Priya over the three-month period, with 15 of them sent outside regular work hours.",
  
  legalReferenceGuide: "POSH Act Legal Reference Guide:\n\n1. Definition of Sexual Harassment (Section 2(n) of the POSH Act):\nSexual harassment includes unwelcome sexually determined behavior such as physical contact, demand or request for sexual favors, sexually colored remarks, showing pornography, or any other unwelcome physical, verbal, or non-verbal conduct of a sexual nature.\n\n2. Workplace Harassment (Section 3):\nNo woman shall be subjected to sexual harassment at any workplace. The following circumstances may amount to sexual harassment:\n- Implied or explicit promise of preferential treatment in employment\n- Implied or explicit threat of detrimental treatment in employment\n- Implied or explicit threat about her present or future employment status\n- Interference with her work or creating an intimidating/offensive/hostile work environment\n- Humiliating treatment likely to affect her health or safety\n\n3. Digital Communications (2023 Amendment):\nUnwelcome behavior extended through digital means, including messaging applications, emails, and virtual meetings, falls within the purview of workplace harassment.\n\n4. Employer Responsibilities (Section 19):\nEvery employer is required to provide a safe working environment, display consequences of sexual harassment, organize workshops and awareness programs, and provide necessary facilities to the Internal Committee for dealing with complaints.",
  
  witnessStatements: [
    {
      name: "Anjali Mathur (HR Manager)",
      statement: "I received Priya's initial verbal complaint three weeks ago. She appeared visibly distressed during our meeting and showed me several screenshots of messages from Rahul that contained personal comments and suggestions to meet outside work."
    },
    {
      name: "Vikram Singh (Team Member)",
      statement: "I noticed that Rahul's communication style with Priya seemed different than with other team members. During video calls, he would often compliment her appearance, which I didn't observe him doing with other team members."
    },
    {
      name: "Deepak Patel (IT Administrator)",
      statement: "As the IT administrator, I verified the authenticity of the message screenshots. Our system logs show that there were 42 direct messages sent from Rahul to Priya over the three-month period, with 15 of them sent outside regular work hours."
    }
  ],
  
  correctResponsibleParty: "Respondent" as ResponsibleParty,
  correctMisconductType: "Sexual Harassment" as MisconductType,
  correctPrimaryMotivation: "Power preservation" as PrimaryMotivation,
  
  analysis: "Case Analysis:\n\nThis case presents a clear example of workplace harassment through digital communications. The respondent's conduct meets the criteria for sexual harassment under the POSH Act for the following reasons:\n\n1. Pattern of Unwelcome Behavior: The evidence shows a persistent pattern of unwelcome personal comments and after-hours communication despite the complainant's attempts to maintain professional boundaries.\n\n2. Impact on Work Environment: The complainant's testimony and witness statements confirm that the harassment created a hostile work environment, affecting her job performance and well-being.\n\n3. Power Dynamics: The hierarchical relationship between a team leader and team member creates an inherent power imbalance that heightens the impact of the harassment.\n\n4. Corroborating Evidence: The digital evidence and witness testimonies provide substantial corroboration of the complainant's allegations.\n\n5. Intent vs. Impact: While the respondent claims no inappropriate intent, sexual harassment is determined by the impact of the behavior rather than the intent behind it.\n\nThe respondent's defense that the communications were friendly or work-related is undermined by the pattern, timing, and content of the messages. The fact that similar communications were not directed at other team members further weakens this defense.\n\nThis case demonstrates the importance of clear digital communication policies in modern workplaces and the need for awareness about how seemingly casual comments can create a hostile environment, particularly in relationships with power differentials."
};

// Define types for cache structure
interface CacheEntry {
  data: SimulationData;
  addedAt: string;
}

interface CacheFile {
  cases: CacheEntry[];
  lastUpdated: string;
}

// Define the path for the cache file
const CACHE_FILE = path.join(process.cwd(), 'caseCache.json');

// Function to initialize the cache file if it doesn't exist
function initializeCache(): void {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (dirError) {
        console.error('Failed to create directory for cache:', dirError);
      }
    }
    
    // Create cache file if it doesn't exist or is empty/invalid
    let needsInit = false;
    
    if (!fs.existsSync(CACHE_FILE)) {
      needsInit = true;
    } else {
      try {
        const content = fs.readFileSync(CACHE_FILE, 'utf8');
        // If file is empty or contains invalid JSON
        if (!content.trim() || content.trim() === '') {
          needsInit = true;
        } else {
          // Try to parse JSON
          const cache = JSON.parse(content);
          // Check if it has the expected structure
          if (!cache || typeof cache !== 'object' || !Array.isArray(cache.cases)) {
            needsInit = true;
          }
        }
      } catch (readError) {
        console.error('Error reading cache file:', readError);
        needsInit = true;
      }
    }
    
    if (needsInit) {
      const initialCache: CacheFile = {
        cases: [],
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(initialCache, null, 2), { mode: 0o644 });
      console.log('Cache file created or reset successfully');
    }
  } catch (error) {
    console.error('Failed to initialize cache file:', error);
  }
}

// Function to save a case to the cache
function saveCaseToCache(caseData: SimulationData): void {
  try {
    // Initialize cache if it doesn't exist
    initializeCache();
    
    // Read existing cache
    let cache: CacheFile = { cases: [], lastUpdated: new Date().toISOString() };
    try {
      const cacheContent = fs.readFileSync(CACHE_FILE, 'utf8');
      if (cacheContent.trim()) {
        const parsedCache = JSON.parse(cacheContent) as CacheFile;
        // Ensure the cases array exists
        if (parsedCache && parsedCache.cases && Array.isArray(parsedCache.cases)) {
          cache = parsedCache;
        }
      }
    } catch (readError) {
      console.error('Error reading cache file, creating new cache:', readError);
      // Continue with empty cache
    }
    
    // Add new case to cache
    const entry: CacheEntry = {
      data: caseData,
      addedAt: new Date().toISOString()
    };
    cache.cases.push(entry);
    
    // Keep only the last 10 cases
    if (cache.cases.length > 10) {
      cache.cases = cache.cases.slice(-10);
    }
    
    // Update cache file
    cache.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    
    console.log('Case saved to cache successfully');
  } catch (error) {
    console.error('Failed to save case to cache:', error);
  }
}

// Function to get a random case from the cache
function getRandomCaseFromCache(): SimulationData | null {
  try {
    // Check if cache file exists
    if (!fs.existsSync(CACHE_FILE)) {
      console.log('Cache file does not exist');
      initializeCache();
      return null;
    }
    
    // Read cache file
    let cache: CacheFile;
    try {
      const cacheContent = fs.readFileSync(CACHE_FILE, 'utf8');
      if (!cacheContent.trim()) {
        console.log('Cache file is empty, initializing');
        initializeCache();
        return null;
      }
      
      cache = JSON.parse(cacheContent) as CacheFile;
    } catch (parseError) {
      console.error('Error parsing cache file, resetting cache:', parseError);
      initializeCache();
      return null;
    }
    
    // If cache is empty or invalid, return null
    if (!cache || !cache.cases || !Array.isArray(cache.cases) || cache.cases.length === 0) {
      console.log('Cache is empty or invalid');
      return null;
    }
    
    // Get a random case from cache
    const randomIndex = Math.floor(Math.random() * cache.cases.length);
    return cache.cases[randomIndex].data;
  } catch (error) {
    console.error('Failed to get random case from cache:', error);
    return null;
  }
}

// Function to implement a timeout for fetch operations
async function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  // Create a promise that rejects after timeoutMs milliseconds
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error('Request timed out');
      console.log('OpenAI request timeout triggered after ' + timeoutMs + 'ms');
      reject(timeoutError);
    }, timeoutMs);
  });
  
  try {
    // Race the original promise against the timeout
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    console.error('Error in fetchWithTimeout:', error);
    
    // Check if it's a timeout error (error message contains 'timed out')
    if (error instanceof Error && error.message.includes('timed out')) {
      console.log('Request timed out - returning control to caller');
    }
    
    throw error;
  }
}

// POST API handler
export async function POST(request: NextRequest) {
  console.log('Generating new POSH case simulation');
  
  try {
    // Always start by trying to generate a new case
    let finalSimulationData = EMPTY_TEMPLATE;

    // Try to use OpenAI API if configured in environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('No API key found, using cache or template as fallback');
      // If no API key, try to get a case from cache as fallback
      const cachedCase = getRandomCaseFromCache();
      if (cachedCase) {
        console.log('Using cached case because no API key is available');
        return NextResponse.json({ 
          simulationText: JSON.stringify(cachedCase)
        });
      }
      
      console.log('No cached cases available, using template');
      return NextResponse.json({ 
        simulationText: JSON.stringify(finalSimulationData) 
      });
    }

    try {
      console.log('Attempting to generate new case with OpenAI API');
      // Initialize OpenAI client with updated timeout settings
      const openai = new OpenAI({ 
        apiKey,
        timeout: 50000,  // Increased timeout for API calls
        maxRetries: 2    // Allow more retries
      });
      
      // Use the imported POSH_TRAINING_SIMULATION_PROMPT instead of the inline prompt
      const poshPrompt = POSH_TRAINING_SIMULATION_PROMPT;

      try {
        // Make the API call with a timeout
        const completionPromise = openai.chat.completions.create({
          // model: "gpt-4o-mini", // Using gpt-4o-mini for faster generation
          model: "gpt-4.1",
          messages: [
            {
              role: 'system',
              content: poshPrompt,
            },
            {
              role: 'user',
              content: "Generate a detailed POSH case for training purposes. You MUST include all required JSON fields correctly including caseOverview, complainantStatement, respondentStatement, additionalEvidence, legalReferenceGuide, correctResponsibleParty, correctMisconductType, correctPrimaryMotivation, and analysis. Make this case unique and different from previous cases.",
            }
          ],
          temperature: 0.8, // Higher temperature for more variety
          max_tokens: 4096, // Maximum context size
          response_format: { type: "json_object" },
        });
        
        // Use timeout for the entire operation
        console.log('Waiting for OpenAI API response (timeout: 50s)');
        const completion = await fetchWithTimeout(completionPromise, 50000);

        const simulationText = completion.choices[0]?.message?.content;
        
        if (!simulationText) {
          console.log('No simulation text in API response, using cache or template as fallback');
          // If no text in response, try to get a case from cache as fallback
          const cachedCase = getRandomCaseFromCache();
          if (cachedCase) {
            console.log('Using cached case due to empty API response');
            return NextResponse.json({ 
              simulationText: JSON.stringify(cachedCase)
            });
          }
          
          console.log('No cached cases available, using template');
          return NextResponse.json({ 
            simulationText: JSON.stringify(finalSimulationData) 
          });
        }
        
        // Validate and fix the JSON if needed
        try {
          // Check if it's valid JSON
          const parsedData = JSON.parse(simulationText) as SimulationData;
          
          // Verify it has the minimum required fields
          const hasRequiredFields = 
            typeof parsedData.caseOverview === 'string' && 
            typeof parsedData.complainantStatement === 'string' && 
            typeof parsedData.respondentStatement === 'string' &&
            typeof parsedData.additionalEvidence === 'string';
          
          if (hasRequiredFields) {
            // Save the successfully generated case to cache for future use
            console.log('Successfully generated new case, saving to cache');
            saveCaseToCache(parsedData);
            finalSimulationData = parsedData;
            
            // Return the newly generated case
            return NextResponse.json({ 
              simulationText: JSON.stringify(finalSimulationData) 
            });
          } else {
            console.log('Generated case missing required fields, using cache or template as fallback');
            // If missing required fields, try to get a case from cache as fallback
            const cachedCase = getRandomCaseFromCache();
            if (cachedCase) {
              console.log('Using cached case due to incomplete API response');
              return NextResponse.json({ 
                simulationText: JSON.stringify(cachedCase)
              });
            }
          }
        } catch (parseError) {
          console.error('Error parsing API response as JSON:', parseError);
          // Try to get a case from cache as fallback
          const cachedCase = getRandomCaseFromCache();
          if (cachedCase) {
            console.log('Using cached case due to JSON parsing error');
            return NextResponse.json({ 
              simulationText: JSON.stringify(cachedCase)
            });
          }
        }
      } catch (timeoutError) {
        console.error('Request or operation timed out:', timeoutError);
        // Try to get a case from cache as fallback
        const cachedCase = getRandomCaseFromCache();
        if (cachedCase) {
          console.log('Using cached case due to API timeout');
          return NextResponse.json({ 
            simulationText: JSON.stringify(cachedCase)
          });
        }
      }
    } catch (openaiError) {
      // Enhanced OpenAI API error handling
      console.error('OpenAI API Error:', openaiError);
      // Try to get a case from cache as fallback
      const cachedCase = getRandomCaseFromCache();
      if (cachedCase) {
        console.log('Using cached case due to OpenAI API error');
        return NextResponse.json({ 
          simulationText: JSON.stringify(cachedCase)
        });
      }
    }
    
    // Always return a successful response with either the generated data or the template
    console.log('Falling back to template as last resort');
    return NextResponse.json({ 
      simulationText: JSON.stringify(finalSimulationData) 
    });
  } catch (error) {
    console.error('Unexpected error generating simulation:', error);
    
    // Try to get a case from cache as final fallback
    const cachedCase = getRandomCaseFromCache();
    if (cachedCase) {
      console.log('Using cached case due to unexpected error');
      return NextResponse.json({ 
        simulationText: JSON.stringify(cachedCase)
      });
    }
    
    // Final fallback - always use template
    console.log('Using template due to unexpected error');
    return NextResponse.json({ 
      simulationText: JSON.stringify(EMPTY_TEMPLATE) 
    });
  }
} 
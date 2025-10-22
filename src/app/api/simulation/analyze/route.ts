import { NextRequest, NextResponse } from 'next/server';
import { ResponsibleParty, MisconductType, PrimaryMotivation, SimulationData } from '@/types/simulation';
import { calculateSimulationScore, formatFinalScores } from '@/utils/scoring';

export const maxDuration = 60; // Set maxDuration to 60 seconds (if using Edge runtime)

export async function POST(request: NextRequest) {
  try {
    const { conclusion, responsible, misconduct, motivation, hiddenInfo, simulationData } = await request.json();
    
    // Validate input
    if (!conclusion || !responsible || !misconduct || !motivation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Handle both new format and old format
    let parsedSimulationData: SimulationData | null = null;
    let correctResponsible: string = '';
    let correctMisconduct: string = '';
    let secondaryMisconduct: string = '';
    let correctMotivation: string = '';
    let caseAnalysis: string = '';
    
    // Try to parse simulationData if it exists
    if (simulationData) {
      try {
        parsedSimulationData = typeof simulationData === 'string' 
          ? JSON.parse(simulationData) 
          : simulationData;
        
        if (parsedSimulationData) {
          correctResponsible = parsedSimulationData.correctResponsibleParty || '';
          correctMisconduct = parsedSimulationData.correctMisconductType || '';
          correctMotivation = parsedSimulationData.correctPrimaryMotivation || '';
          caseAnalysis = parsedSimulationData.analysis || '';
        }
      } catch (e) {
        console.error('Failed to parse simulation data:', e);
      }
    }
    
    // Fall back to hiddenInfo if simulationData parsing fails
    if ((!parsedSimulationData || !correctResponsible) && hiddenInfo) {
      try {
        const hiddenData = typeof hiddenInfo === 'string' ? JSON.parse(hiddenInfo) : hiddenInfo;
        
        // Handle old format
        correctResponsible = hiddenData.correctResponsible || '';
        correctMisconduct = hiddenData.correctMisconduct || '';
        secondaryMisconduct = hiddenData.secondaryMisconduct || '';
        correctMotivation = hiddenData.correctMotivation || '';
        caseAnalysis = hiddenData.caseSummary || '';
      } catch (e) {
        console.error('Failed to parse hidden info:', e);
      }
    }
    
    // Default values if we couldn't extract from either format
    if (!correctResponsible) correctResponsible = 'Respondent';
    if (!correctMisconduct) correctMisconduct = 'Sexual Harassment';
    if (!correctMotivation) correctMotivation = 'Power preservation';
    
    // Calculate accuracy scores
    const responsibleCorrect = isResponsibleCorrect(responsible, correctResponsible);
    const misconductCorrect = isMisconductCorrect(misconduct, correctMisconduct, secondaryMisconduct);
    const motivationCorrect = isMotivationCorrect(motivation, correctMotivation);
    
    // Generate analysis based on user's conclusion and accuracy
    const analysis = generateAnalysis(
      conclusion,
      responsible,
      misconduct,
      motivation,
      responsibleCorrect,
      misconductCorrect,
      motivationCorrect,
      { 
        correctResponsible,
        correctMisconduct,
        secondaryMisconduct,
        correctMotivation,
        caseSummary: caseAnalysis
      }
    );
    
    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    console.error('Error analyzing conclusion:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conclusion' },
      { status: 500 }
    );
  }
}

// Helper functions for checking accuracy
function isResponsibleCorrect(userSelection: string, correctValue: string): boolean {
  if (!correctValue) return true; // If we don't have a correct value, consider it correct
  
  // Map from legacy format to new format
  const legacyMapping: Record<string, string> = {
    'Arjun Mehta': 'Respondent',
    'Priya Sharma': 'Complainant'
  };
  
  const normalizedUser = normalizeResponseValue(userSelection);
  const normalizedCorrect = normalizeResponseValue(correctValue);
  
  // Check direct match
  if (normalizedUser === normalizedCorrect) return true;
  
  // Check mapping from legacy to new format
  if (legacyMapping[normalizedUser] && normalizeResponseValue(legacyMapping[normalizedUser]) === normalizedCorrect) return true;
  
  // Check mapping from new to legacy format
  for (const [legacy, newFormat] of Object.entries(legacyMapping)) {
    if (normalizedUser === normalizeResponseValue(newFormat) && normalizedCorrect === normalizeResponseValue(legacy)) {
      return true;
    }
  }
  
  return false;
}

function isMisconductCorrect(userSelection: string, primaryMisconduct: string, secondaryMisconduct: string): boolean {
  if (!primaryMisconduct) return true; // If we don't have a correct value, consider it correct
  
  // Map from legacy format to new format
  const legacyMapping: Record<string, string> = {
    'verbal': 'Sexual Harassment',
    'physical': 'Sexual Harassment',
    'quidProQuo': 'Sexual Harassment',
    'hostileEnvironment': 'Sexual Harassment'
  };
  
  const normalizedUser = normalizeResponseValue(userSelection);
  const normalizedPrimary = normalizeResponseValue(primaryMisconduct);
  const normalizedSecondary = normalizeResponseValue(secondaryMisconduct);
  
  // Check direct match
  if (normalizedUser === normalizedPrimary || normalizedUser === normalizedSecondary) return true;
  
  // Check mapping from legacy to new format
  if (legacyMapping[normalizedUser] && (normalizeResponseValue(legacyMapping[normalizedUser]) === normalizedPrimary 
     || normalizeResponseValue(legacyMapping[normalizedUser]) === normalizedSecondary)) return true;
  
  // Check mapping from new to legacy format
  for (const [legacy, newFormat] of Object.entries(legacyMapping)) {
    if ((normalizedUser === normalizeResponseValue(newFormat)) && 
        (normalizedPrimary === normalizeResponseValue(legacy) || normalizedSecondary === normalizeResponseValue(legacy))) {
      return true;
    }
  }
  
  return false;
}

function isMotivationCorrect(userSelection: string, correctValue: string): boolean {
  if (!correctValue) return true; // If we don't have a correct value, consider it correct
  
  // Map from legacy format to new format
  const legacyMapping: Record<string, string> = {
    'power': 'Power preservation',
    'sexual': 'Jealousy',
    'retaliation': 'Retaliation',
    'misunderstanding': 'Misunderstanding'
  };
  
  const normalizedUser = normalizeResponseValue(userSelection);
  const normalizedCorrect = normalizeResponseValue(correctValue);
  
  // Check direct match
  if (normalizedUser === normalizedCorrect) return true;
  
  // Check mapping from legacy to new format
  if (legacyMapping[normalizedUser] && normalizeResponseValue(legacyMapping[normalizedUser]) === normalizedCorrect) return true;
  
  // Check mapping from new to legacy format
  for (const [legacy, newFormat] of Object.entries(legacyMapping)) {
    if (normalizedUser === normalizeResponseValue(newFormat) && normalizedCorrect === normalizeResponseValue(legacy)) {
      return true;
    }
  }
  
  return false;
}

function normalizeResponseValue(value: string): string {
  if (!value) return '';
  return value.toLowerCase().trim();
}

// Generate the analysis HTML with feedback
function generateAnalysis(
  conclusion: string,
  responsible: string,
  misconduct: string,
  motivation: string,
  responsibleCorrect: boolean,
  misconductCorrect: boolean,
  motivationCorrect: boolean,
  hiddenData: {
    correctResponsible: string;
    correctMisconduct: string;
    secondaryMisconduct: string;
    correctMotivation: string;
    caseSummary: string;
  }
): string {
  // Calculate overall score
  const totalCorrect = [responsibleCorrect, misconductCorrect, motivationCorrect].filter(Boolean).length;
  const scorePercentage = Math.round((totalCorrect / 3) * 100);
  
  // Determine accuracy level text and color
  let accuracyLevel = '';
  let accuracyColor = '';
  
  if (scorePercentage >= 90) {
    accuracyLevel = 'Excellent';
    accuracyColor = 'text-green-500';
  } else if (scorePercentage >= 70) {
    accuracyLevel = 'Good';
    accuracyColor = 'text-blue-500';
  } else if (scorePercentage >= 50) {
    accuracyLevel = 'Fair';
    accuracyColor = 'text-yellow-500';
  } else {
    accuracyLevel = 'Needs Improvement';
    accuracyColor = 'text-red-500';
  }
  
  // Calculate 3-parameter scores using centralized scoring system
  const performanceContent = `
POSH Investigation Report:
- Responsible Party Assessment: ${responsibleCorrect ? 'Correct' : 'Incorrect'}
- Misconduct Type Assessment: ${misconductCorrect ? 'Correct' : 'Incorrect'}
- Motivation Assessment: ${motivationCorrect ? 'Correct' : 'Incorrect'}
- Overall Accuracy: ${scorePercentage}%

User demonstrated ${responsibleCorrect ? 'strong awareness' : 'limited awareness'} of organizational dynamics.
User showed ${misconductCorrect ? 'good decision integrity' : 'needs improvement in decision integrity'} in identifying misconduct.
User exhibited ${motivationCorrect ? 'high sensitivity' : 'needs better sensitivity'} to underlying motivations.
  `.trim();

  const calculatedScores = calculateSimulationScore(
    'POSH_SIMULATION',
    performanceContent,
    {
      responsibleCorrect,
      misconductCorrect,
      motivationCorrect,
      totalCorrect,
      scorePercentage
    }
  );

  // Build the analysis HTML with 3-parameter scoring
  let analysisHtml = `
    <div class="space-y-4">
      <div class="mb-6">
        <h4 class="text-lg font-bold mb-2">Final Scores</h4>
        <div class="bg-gray-100 p-4 rounded-lg">
          <p><strong>Awareness:</strong> ${calculatedScores.parameter1}/10</p>
          <p><strong>Decision Integrity:</strong> ${calculatedScores.parameter2}/10</p>
          <p><strong>Sensitivity:</strong> ${calculatedScores.parameter3}/10</p>
          <p><strong>Overall Outcome:</strong> ${calculatedScores.summary}</p>
        </div>
      </div>

      <div class="mb-6">
        <h4 class="text-lg font-bold mb-2">Analysis Summary</h4>
        <p>Your conclusion accuracy is: <span class="${accuracyColor} font-bold">${accuracyLevel} (${scorePercentage}%)</span></p>
      </div>

      <div class="mb-4">
        <h4 class="text-lg font-bold mb-2">Your Selections</h4>
        <ul class="list-disc pl-5 space-y-1">
          <li>Responsible Party: ${getReadableResponsible(responsible)} ${responsibleCorrect ? '✓' : '✗'}</li>
          <li>Type of Misconduct: ${getReadableMisconduct(misconduct)} ${misconductCorrect ? '✓' : '✗'}</li>
          <li>Primary Motivation: ${getReadableMotivation(motivation)} ${motivationCorrect ? '✓' : '✗'}</li>
        </ul>
      </div>
  `;
  
  // Add detailed feedback section
  analysisHtml += `
      <div class="mb-4">
        <h4 class="text-lg font-bold mb-2">Detailed Feedback</h4>
        <div class="space-y-3">
  `;
  
  // Responsible party feedback
  if (responsibleCorrect) {
    analysisHtml += `<p class="text-green-500">✓ You correctly identified the responsible party.</p>`;
  } else {
    const correctParty = hiddenData.correctResponsible ? getReadableResponsible(hiddenData.correctResponsible) : 'another party';
    analysisHtml += `<p class="text-red-500">✗ Your identification of the responsible party was incorrect. The evidence points to ${correctParty}.</p>`;
  }
  
  // Misconduct type feedback
  if (misconductCorrect) {
    analysisHtml += `<p class="text-green-500">✓ You correctly identified the type of misconduct.</p>`;
  } else {
    const correctType = hiddenData.correctMisconduct ? getReadableMisconduct(hiddenData.correctMisconduct) : 'another type of misconduct';
    const secondaryType = hiddenData.secondaryMisconduct ? ` or ${getReadableMisconduct(hiddenData.secondaryMisconduct)}` : '';
    analysisHtml += `<p class="text-red-500">✗ Your identification of the misconduct type was incorrect. The evidence indicates ${correctType}${secondaryType}.</p>`;
  }
  
  // Motivation feedback
  if (motivationCorrect) {
    analysisHtml += `<p class="text-green-500">✓ You correctly identified the primary motivation.</p>`;
  } else {
    const correctMotivation = hiddenData.correctMotivation ? getReadableMotivation(hiddenData.correctMotivation) : 'another motivation';
    analysisHtml += `<p class="text-red-500">✗ Your identification of the primary motivation was incorrect. The evidence suggests ${correctMotivation}.</p>`;
  }
  
  // Add case summary if available
  if (hiddenData.caseSummary) {
    analysisHtml += `
        </div>
      </div>
      
      <div class="mb-4">
        <h4 class="text-lg font-bold text-green-500 mb-2">Expert Analysis</h4>
        <p>${hiddenData.caseSummary}</p>
      </div>
    `;
  } else {
    analysisHtml += `
        </div>
      </div>
    `;
  }
  
  // Close the outer div
  analysisHtml += `</div>`;
  
  return analysisHtml;
}

// Helper functions to convert IDs to readable text
function getReadableResponsible(id: string): string {
  // Map from new format to human readable
  const newFormatOptions: Record<string, string> = {
    'Respondent': 'The Respondent',
    'Complainant': 'The Complainant',
    'Both Parties': 'Both Parties',
    'Neither Party': 'Neither Party'
  };
  
  // Map from legacy format to human readable
  const legacyOptions: Record<string, string> = {
    'employee1': 'Employee 1',
    'employee2': 'Employee 2',
    'manager': 'Manager',
    'supervisor': 'Supervisor',
    'noViolation': 'No POSH Violation Occurred',
    'Arjun Mehta': 'Arjun Mehta',
    'Priya Sharma': 'Priya Sharma',
    'arjun': 'Arjun Mehta',
    'priya': 'Priya Sharma',
    'arjunmehta': 'Arjun Mehta',
    'priyasharma': 'Priya Sharma'
  };
  
  return newFormatOptions[id] || legacyOptions[id] || id;
}

function getReadableMisconduct(id: string): string {
  // Map from new format to human readable
  const newFormatOptions: Record<string, string> = {
    'Sexual Harassment': 'Sexual Harassment',
    'Discrimination': 'Discrimination',
    'Retaliation': 'Retaliation',
    'No Misconduct': 'No Misconduct'
  };
  
  // Map from legacy format to human readable
  const legacyOptions: Record<string, string> = {
    'verbal': 'Verbal Harassment',
    'physical': 'Physical Harassment',
    'visual': 'Visual Harassment',
    'quidProQuo': 'Quid Pro Quo Harassment',
    'hostileEnvironment': 'Creating Hostile Environment',
    'none': 'No Misconduct'
  };
  
  return newFormatOptions[id] || legacyOptions[id] || id;
}

function getReadableMotivation(id: string): string {
  // Map from new format to human readable
  const newFormatOptions: Record<string, string> = {
    'Power preservation': 'Power Preservation',
    'Retaliation': 'Retaliation',
    'Jealousy': 'Jealousy',
    'Gender-based prejudice': 'Gender-based Prejudice',
    'Genuine Complaint': 'Genuine Complaint',
    'Personal Vendetta': 'Personal Vendetta',
    'Career Advancement': 'Career Advancement',
    'Misunderstanding': 'Misunderstanding'
  };
  
  // Map from legacy format to human readable
  const legacyOptions: Record<string, string> = {
    'power': 'Power Dynamics',
    'sexual': 'Sexual Interest',
    'retaliation': 'Retaliation',
    'misunderstanding': 'Misunderstanding',
    'falseComplaint': 'False Complaint',
    'none': 'No Motivation (No Violation)'
  };
  
  return newFormatOptions[id] || legacyOptions[id] || id;
} 
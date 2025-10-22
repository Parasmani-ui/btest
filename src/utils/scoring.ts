// 3-Parameter Scoring System for All Simulations
// Based on the provided simulation parameters and meta-competencies

export interface SimulationScore {
  parameter1: number; // Score out of 10
  parameter2: number; // Score out of 10  
  parameter3: number; // Score out of 10
  overall: number; // Overall score out of 100
  summary: string; // Brief outcome summary
}

export interface SimulationParameters {
  parameter1: string;
  parameter2: string;
  parameter3: string;
  metaCompetencies: string[];
}

// Simulation parameter definitions
export const SIMULATION_PARAMETERS: Record<string, SimulationParameters> = {
  'POSH_SIMULATION': {
    parameter1: 'Awareness',
    parameter2: 'Decision Integrity', 
    parameter3: 'Sensitivity',
    metaCompetencies: ['Organizational Understanding', 'Self-awareness', 'Collaboration']
  },
  'DETECTIVE_SIMULATION': {
    parameter1: 'Critical Thinking',
    parameter2: 'Evidence Analysis',
    parameter3: 'Intuition',
    metaCompetencies: ['Strategic Outlook', 'Growth Mindset', 'Decisiveness']
  },
  'FINANCIAL_FORENSIC_SIMULATION': {
    parameter1: 'Data Accuracy',
    parameter2: 'Compliance Awareness',
    parameter3: 'Risk Assessment',
    metaCompetencies: ['Strategic Outlook', 'Resource Allocation', 'Organizational Understanding']
  },
  'HOSPITAL_CRISIS_SIMULATION': {
    parameter1: 'Leadership',
    parameter2: 'Resource Management',
    parameter3: 'Decision Clarity',
    metaCompetencies: ['Leadership', 'Resource Allocation', 'Agility']
  },
  'CHAINFAIL_SIMULATION': {
    parameter1: 'Technical Analysis',
    parameter2: 'Safety Awareness',
    parameter3: 'Preventive Planning',
    metaCompetencies: ['Adaptability', 'Strategic Outlook', 'Leadership']
  },
  'FAKE_NEWS_SIMULATION': {
    parameter1: 'Fact Verification',
    parameter2: 'Bias Awareness',
    parameter3: 'Ethical Judgement',
    metaCompetencies: ['Self-awareness', 'Growth Mindset', 'Decisiveness']
  },
  'SUICIDE_AWARENESS_SIMULATION': {
    parameter1: 'Empathy',
    parameter2: 'Response Time',
    parameter3: 'Intervention Quality',
    metaCompetencies: ['Collaboration', 'Adaptability', 'Leadership']
  },
  'NEGOTIATION_SIMULATION': {
    parameter1: 'Assertiveness',
    parameter2: 'Data-Driven Arguments',
    parameter3: 'Empathy/Relationship Maintenance',
    metaCompetencies: ['Collaboration', 'Agility', 'Strategic Outlook']
  },
  'POSH_ACADEMY_SIMULATION': {
    parameter1: 'Communication Clarity',
    parameter2: 'Policy Knowledge',
    parameter3: 'Case Handling',
    metaCompetencies: ['Leadership', 'Organizational Understanding', 'Growth Mindset']
  }
};

// Calculate 3-parameter score based on simulation type and content
export function calculateSimulationScore(
  simulationType: string,
  content: string,
  decisions?: any,
  messages?: any[]
): SimulationScore {
  const params = SIMULATION_PARAMETERS[simulationType];
  if (!params) {
    // Fallback for unknown simulation types
    return {
      parameter1: 5,
      parameter2: 5,
      parameter3: 5,
      overall: 50,
      summary: 'Standard performance'
    };
  }

  // Extract scores from content using regex patterns
  let score1 = extractParameterScore(content, params.parameter1);
  let score2 = extractParameterScore(content, params.parameter2);
  let score3 = extractParameterScore(content, params.parameter3);

  // Apply decision-based adjustments if provided
  if (decisions) {
    const adjustments = calculateDecisionAdjustments(simulationType, decisions);
    score1 = Math.min(10, Math.max(1, score1 + adjustments.parameter1));
    score2 = Math.min(10, Math.max(1, score2 + adjustments.parameter2));
    score3 = Math.min(10, Math.max(1, score3 + adjustments.parameter3));
  }

  // Calculate overall score (average of the three parameters)
  const overall = Math.round((score1 + score2 + score3) / 3 * 10);

  // Generate summary based on overall performance
  const summary = generatePerformanceSummary(overall);

  return {
    parameter1: Math.round(score1),
    parameter2: Math.round(score2),
    parameter3: Math.round(score3),
    overall,
    summary
  };
}

// Calculate decision-based adjustments for scores
function calculateDecisionAdjustments(simulationType: string, decisions: any): { parameter1: number, parameter2: number, parameter3: number } {
  const adjustments = { parameter1: 0, parameter2: 0, parameter3: 0 };

  switch (simulationType) {
    case 'DETECTIVE_SIMULATION':
      // Adjust Critical Thinking based on correct arrest
      if (decisions.correct) {
        adjustments.parameter1 += 3; // Boost for correct arrest
      } else {
        adjustments.parameter1 -= 2; // Penalty for wrong arrest
      }

      // Adjust Evidence Analysis based on evidence gathered
      if (decisions.evidenceCount >= 4) {
        adjustments.parameter2 += 2;
      } else if (decisions.evidenceCount >= 2) {
        adjustments.parameter2 += 1;
      } else {
        adjustments.parameter2 -= 1;
      }

      // Adjust Intuition based on efficiency
      if (decisions.correct && decisions.hintsUsed === 0) {
        adjustments.parameter3 += 3; // Excellent intuition
      } else if (decisions.correct) {
        adjustments.parameter3 += 1;
      } else {
        adjustments.parameter3 -= 1;
      }
      break;

    case 'NEGOTIATION_SIMULATION':
      // Add negotiation-specific adjustments here if needed
      break;

    case 'POSH_SIMULATION':
      // Adjust Awareness based on responsible party identification
      if (decisions.responsibleCorrect) {
        adjustments.parameter1 += 2;
      } else {
        adjustments.parameter1 -= 2;
      }

      // Adjust Decision Integrity based on misconduct identification
      if (decisions.misconductCorrect) {
        adjustments.parameter2 += 2;
      } else {
        adjustments.parameter2 -= 2;
      }

      // Adjust Sensitivity based on motivation identification
      if (decisions.motivationCorrect) {
        adjustments.parameter3 += 2;
      } else {
        adjustments.parameter3 -= 2;
      }

      // Bonus for perfect score
      if (decisions.totalCorrect === 3) {
        adjustments.parameter1 += 1;
        adjustments.parameter2 += 1;
        adjustments.parameter3 += 1;
      }
      break;

    // Add more simulation-specific adjustments as needed
  }

  return adjustments;
}

// Extract parameter score from content using various patterns
function extractParameterScore(content: string, parameterName: string): number {
  const contentLower = content.toLowerCase();
  const paramLower = parameterName.toLowerCase();

  // Look for explicit score patterns
  const scorePatterns = [
    new RegExp(`${paramLower}[\\s]*:?[\\s]*(\\d+)/10`, 'i'),
    new RegExp(`${paramLower}[\\s]*:?[\\s]*(\\d+)`, 'i'),
    new RegExp(`${paramLower}[\\s]*score[\\s]*:?[\\s]*(\\d+)`, 'i'),
    new RegExp(`${paramLower}[\\s]*rating[\\s]*:?[\\s]*(\\d+)`, 'i')
  ];

  for (const pattern of scorePatterns) {
    const match = content.match(pattern);
    if (match) {
      const score = parseInt(match[1]);
      return Math.min(10, Math.max(0, score));
    }
  }

  // Fallback: analyze content quality for the parameter
  return analyzeContentQuality(content, parameterName);
}

// Analyze content quality to determine parameter score
function analyzeContentQuality(content: string, parameterName: string): number {
  const contentLower = content.toLowerCase();
  const paramLower = parameterName.toLowerCase();

  // Define quality indicators for different parameters
  const qualityIndicators: Record<string, { positive: string[], negative: string[] }> = {
    'awareness': {
      positive: ['aware', 'conscious', 'recognized', 'identified', 'understood', 'perceived'],
      negative: ['unaware', 'missed', 'overlooked', 'ignored', 'unrecognized']
    },
    'decision integrity': {
      positive: ['ethical', 'principled', 'consistent', 'fair', 'just', 'honest'],
      negative: ['unethical', 'biased', 'inconsistent', 'unfair', 'corrupt']
    },
    'sensitivity': {
      positive: ['sensitive', 'empathetic', 'considerate', 'thoughtful', 'compassionate'],
      negative: ['insensitive', 'harsh', 'callous', 'thoughtless', 'cruel']
    },
    'critical thinking': {
      positive: ['analytical', 'logical', 'systematic', 'thorough', 'reasoned'],
      negative: ['superficial', 'illogical', 'hasty', 'unreasoned', 'shallow']
    },
    'evidence analysis': {
      positive: ['thorough', 'comprehensive', 'detailed', 'systematic', 'methodical'],
      negative: ['superficial', 'incomplete', 'hasty', 'careless', 'sloppy']
    },
    'intuition': {
      positive: ['insightful', 'perceptive', 'intuitive', 'keen', 'sharp'],
      negative: ['oblivious', 'unperceptive', 'dull', 'slow', 'unaware']
    },
    'data accuracy': {
      positive: ['accurate', 'precise', 'correct', 'verified', 'validated'],
      negative: ['inaccurate', 'incorrect', 'wrong', 'flawed', 'erroneous']
    },
    'compliance awareness': {
      positive: ['compliant', 'adherent', 'following', 'observing', 'abiding'],
      negative: ['non-compliant', 'violating', 'breaching', 'ignoring', 'flouting']
    },
    'risk assessment': {
      positive: ['thorough', 'comprehensive', 'detailed', 'systematic', 'careful'],
      negative: ['superficial', 'incomplete', 'hasty', 'careless', 'negligent']
    },
    'leadership': {
      positive: ['leading', 'guiding', 'directing', 'inspiring', 'motivating'],
      negative: ['passive', 'followers', 'uninspiring', 'demotivating', 'weak']
    },
    'resource management': {
      positive: ['efficient', 'effective', 'optimized', 'well-allocated', 'strategic'],
      negative: ['inefficient', 'wasteful', 'poorly-allocated', 'chaotic', 'disorganized']
    },
    'decision clarity': {
      positive: ['clear', 'decisive', 'firm', 'confident', 'resolute'],
      negative: ['unclear', 'indecisive', 'hesitant', 'uncertain', 'confused']
    },
    'technical analysis': {
      positive: ['thorough', 'detailed', 'systematic', 'comprehensive', 'precise'],
      negative: ['superficial', 'incomplete', 'hasty', 'careless', 'sloppy']
    },
    'safety awareness': {
      positive: ['safety-conscious', 'cautious', 'vigilant', 'alert', 'careful'],
      negative: ['reckless', 'careless', 'negligent', 'unaware', 'dangerous']
    },
    'preventive planning': {
      positive: ['proactive', 'preventive', 'forward-thinking', 'strategic', 'prepared'],
      negative: ['reactive', 'unprepared', 'short-sighted', 'impulsive', 'chaotic']
    },
    'fact verification': {
      positive: ['verified', 'confirmed', 'validated', 'authenticated', 'checked'],
      negative: ['unverified', 'unconfirmed', 'unchecked', 'assumed', 'speculated']
    },
    'bias awareness': {
      positive: ['unbiased', 'objective', 'fair', 'neutral', 'balanced'],
      negative: ['biased', 'subjective', 'unfair', 'partial', 'prejudiced']
    },
    'ethical judgement': {
      positive: ['ethical', 'moral', 'principled', 'virtuous', 'righteous'],
      negative: ['unethical', 'immoral', 'unprincipled', 'corrupt', 'wicked']
    },
    'empathy': {
      positive: ['empathetic', 'compassionate', 'understanding', 'caring', 'sensitive'],
      negative: ['unempathetic', 'cold', 'uncaring', 'insensitive', 'harsh']
    },
    'response time': {
      positive: ['quick', 'rapid', 'immediate', 'prompt', 'swift'],
      negative: ['slow', 'delayed', 'late', 'tardy', 'sluggish']
    },
    'intervention quality': {
      positive: ['effective', 'successful', 'helpful', 'beneficial', 'constructive'],
      negative: ['ineffective', 'unsuccessful', 'harmful', 'counterproductive', 'destructive']
    },
    'assertiveness': {
      positive: ['assertive', 'confident', 'firm', 'decisive', 'bold'],
      negative: ['passive', 'timid', 'hesitant', 'uncertain', 'weak']
    },
    'data-driven arguments': {
      positive: ['data-driven', 'evidence-based', 'factual', 'analytical', 'logical'],
      negative: ['emotional', 'speculative', 'unfounded', 'illogical', 'irrational']
    },
    'empathy/relationship maintenance': {
      positive: ['empathetic', 'relationship-focused', 'collaborative', 'understanding', 'supportive'],
      negative: ['unempathetic', 'confrontational', 'aggressive', 'unsupportive', 'hostile']
    },
    'communication clarity': {
      positive: ['clear', 'articulate', 'precise', 'understandable', 'coherent'],
      negative: ['unclear', 'confusing', 'vague', 'incomprehensible', 'muddled']
    },
    'policy knowledge': {
      positive: ['knowledgeable', 'informed', 'expert', 'well-versed', 'competent'],
      negative: ['ignorant', 'uninformed', 'inexperienced', 'unfamiliar', 'incompetent']
    },
    'case handling': {
      positive: ['professional', 'systematic', 'thorough', 'competent', 'effective'],
      negative: ['unprofessional', 'chaotic', 'incomplete', 'incompetent', 'ineffective']
    }
  };

  const indicators = qualityIndicators[paramLower] || {
    positive: ['excellent', 'outstanding', 'superior', 'effective', 'successful'],
    negative: ['poor', 'inadequate', 'failed', 'unsuccessful', 'ineffective']
  };

  let positiveCount = 0;
  let negativeCount = 0;

  indicators.positive.forEach(indicator => {
    if (contentLower.includes(indicator)) positiveCount++;
  });

  indicators.negative.forEach(indicator => {
    if (contentLower.includes(indicator)) negativeCount++;
  });

  // Calculate score based on positive vs negative indicators
  const netScore = positiveCount - negativeCount;
  const baseScore = 5; // Start with average score
  const adjustment = Math.max(-3, Math.min(3, netScore)); // Limit adjustment to ±3
  
  return Math.min(10, Math.max(0, baseScore + adjustment));
}

// Generate performance summary based on overall score
function generatePerformanceSummary(overallScore: number): string {
  if (overallScore >= 90) {
    return 'Exceptional performance with outstanding results';
  } else if (overallScore >= 80) {
    return 'Excellent performance with strong results';
  } else if (overallScore >= 70) {
    return 'Good performance with solid results';
  } else if (overallScore >= 60) {
    return 'Satisfactory performance with room for improvement';
  } else if (overallScore >= 50) {
    return 'Average performance with significant improvement needed';
  } else {
    return 'Below average performance requiring substantial improvement';
  }
}

// Format the final scores for display
export function formatFinalScores(score: SimulationScore, simulationType: string): string {
  const params = SIMULATION_PARAMETERS[simulationType];
  if (!params) return '';

  return `**Final Scores:**  
${params.parameter1}: ${score.parameter1}/10  
${params.parameter2}: ${score.parameter2}/10  
${params.parameter3}: ${score.parameter3}/10  
Overall Outcome: ${score.summary}`;
}

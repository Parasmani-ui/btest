import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { calculateSimulationScore, formatFinalScores } from '@/utils/scoring';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to clean up generated content
function cleanAnalysisContent(content: string): string {
  return content
    .replace(/\*\*/g, '') // Remove ** bold markdown
    .replace(/\*/g, '') // Remove * asterisks
    .replace(/##/g, '') // Remove ## headers
    .replace(/#/g, '') // Remove # headers
    .replace(/\[Button:\s*[^\]]*\]/g, '') // Remove button descriptions
    .replace(/\n\s*\n\s*\n+/g, '\n') // Remove all multiple line breaks
    .replace(/\n\s*\n/g, '\n') // Convert double line breaks to single
    .replace(/\n\s+/g, '\n') // Remove spaces after line breaks
    .replace(/\s+\n/g, '\n') // Remove spaces before line breaks
    .replace(/\n+/g, '\n') // Collapse any remaining multiple line breaks
    .replace(/^\s*[-\*\+]\s*/gm, '- ') // Normalize list markers
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { caseData, userDecisions, analysisType } = await request.json();

    console.log('Starting fake news analysis...', { analysisType });

    let prompt = '';
    
    if (analysisType === 'final_judgment') {
      prompt = `
        Based on the following fake news case data and user decisions, provide a detailed analysis:

        CASE DATA:
        ${caseData}

        USER DECISIONS:
        - Original Post Assessment: ${userDecisions.postFactuality}
        - Key Amplifier: ${userDecisions.keyAmplifier}
        - Most Critical Evidence: ${userDecisions.criticalEvidence}
        - Consequence Severity: ${userDecisions.consequenceSeverity}

        Please provide a comprehensive analysis that MUST include:

        **Final Scores:**
        Fact Verification: [score]/10
        Bias Awareness: [score]/10
        Ethical Judgement: [score]/10
        Overall Outcome: [summary outcome]

        Then provide:
        1. Evaluation of the accuracy of each decision
        2. Explanation of the correct answers with evidence
        3. Key learning points about misinformation detection
        4. Constructive feedback for improvement

        Use simple, clear language without any special formatting symbols. Write in a professional but accessible tone that helps the user learn from their decisions. NO extra line breaks or spacing between paragraphs.
      `;
    } else {
      prompt = `
        Based on the fake news case: ${caseData}
        
        The user wants to: ${analysisType}
        
        Provide the appropriate information without revealing the final answers. Focus on helping them understand the case better. Use simple, clear language without special formatting symbols, extra line breaks, or unnecessary spacing.
      `;
    }

    const completion = await openai.chat.completions.create({
      // model: "gpt-4o-mini",
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "You are FACTLOCK, a cyber forensics training AI. Provide detailed, educational analysis of misinformation cases using simple, clear language without markdown formatting or special symbols. Focus on being helpful and educational. ABSOLUTELY NO extra line breaks or spacing between paragraphs. Keep content compact and concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the analysis content before sending to client
    const cleanedResponse = cleanAnalysisContent(response);

    // Calculate 3-parameter scores for final judgment
    let scoreData = null;
    let formattedScores = null;
    if (analysisType === 'final_judgment') {
      // Calculate scores using centralized scoring system
      const calculatedScores = calculateSimulationScore(
        'FAKE_NEWS_SIMULATION',
        cleanedResponse,
        {
          userDecisions
        }
      );

      // Format the scores for display
      formattedScores = formatFinalScores(calculatedScores, 'FAKE_NEWS_SIMULATION');

      scoreData = {
        parameter1: calculatedScores.parameter1,
        parameter2: calculatedScores.parameter2,
        parameter3: calculatedScores.parameter3,
        overall: calculatedScores.overall,
        summary: calculatedScores.summary,
        // Legacy compatibility
        factVerification: calculatedScores.parameter1,
        biasAwareness: calculatedScores.parameter2,
        ethicalJudgement: calculatedScores.parameter3
      };
    }

    return NextResponse.json({
      success: true,
      analysis: cleanedResponse,
      score: scoreData,
      formattedScores: formattedScores
    });

  } catch (error) {
    console.error('Error in fake news analysis:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze case'
    }, { status: 500 });
  }
} 
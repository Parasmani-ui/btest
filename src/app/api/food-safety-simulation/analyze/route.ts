import { NextRequest, NextResponse } from 'next/server';
import { CRITICAL_THINKING_SIMULATION_PROMPT } from '@/utils/prompts';

export async function POST(request: NextRequest) {
  try {
    const { action, input, currentRound, interactions, caseTitle } = await request.json();
    
    if (action === 'get_hint') {
      const hintResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // model: 'gpt-4o-mini',
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: CRITICAL_THINKING_SIMULATION_PROMPT
            },
            {
              role: 'user',
              content: `Round ${currentRound}: Please provide a hint for the CEO. Current context: ${JSON.stringify(interactions.slice(-2))}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!hintResponse.ok) {
        throw new Error('Failed to get hint');
      }

      const hintData = await hintResponse.json();
      const hintContent = hintData.choices[0].message.content;
      
      return NextResponse.json({
        fssaiResponse: hintContent,
        success: true
      });
    }

    // Handle CEO responses
    const contextMessages = [
      {
        role: 'system',
        content: CRITICAL_THINKING_SIMULATION_PROMPT
      },
      {
        role: 'user',
        content: 'Let\'s Start'
      }
    ];

    // Add conversation history
    interactions.forEach((interaction: any) => {
      contextMessages.push({
        role: interaction.type === 'fssai' ? 'assistant' : 'user',
        content: interaction.content
      });
    });

    // Add current CEO response
    contextMessages.push({
      role: 'user',
      content: input || action
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // model: 'gpt-4o-mini',
        model: 'gpt-4.1',
        messages: contextMessages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze CEO response');
    }

    const data = await response.json();
    let fssaiResponse = data.choices[0].message.content;
    
    // Determine if game should end
    // When currentRound is 4, we're processing the 5th round (final round)
    const gameEnded = (currentRound >= 4) || action === 'submit_final_position';
    
    // Remove "WHAT WOULD YOU LIKE TO DO NEXT?" from the final response
    if (gameEnded) {
      fssaiResponse = fssaiResponse.replace(/WHAT WOULD YOU LIKE TO DO NEXT\?/g, '').trim();
    }
    
    let scores, finalVerdict, finalStatement;
    
    if (gameEnded) {
      // Generate final assessment
      const assessmentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // model: 'gpt-4o-mini',
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are evaluating a CEO's performance in a critical thinking simulation. The CEO was defending against FSSAI's ban on Maggi noodles. Provide a detailed assessment in this exact format:

End of the game.
Feedback and Reflection
Summary of User's Questioning Approach:
• [Detailed analysis of what they did well and what they missed]
• [Specific points about their questioning strategy]

Insightfulness of User's Questions:
• [Analysis of question depth and quality]
• [Specific examples of good or missed opportunities]
• Insightful Questions: X/5

Evaluation of Evidence:
• [How well they analyzed and challenged the evidence]
• [What they accepted vs what they should have questioned]
• Evidence Evaluation: X/5

Overall, [provide constructive feedback for improvement]`
            },
            {
              role: 'user',
              content: `Please evaluate the CEO's performance based on this conversation history: ${JSON.stringify(interactions)}. Focus on their critical thinking, evidence evaluation, and questioning approach.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (assessmentResponse.ok) {
        const assessmentData = await assessmentResponse.json();
        const assessment = assessmentData.choices[0].message.content;
        
        // Extract scores from the assessment
        const insightfulnessMatch = assessment.match(/Insightful Questions:\s*(\d+)\/5/);
        const evidenceMatch = assessment.match(/Evidence Evaluation:\s*(\d+)\/5/);
        
        scores = {
          insightfulness: insightfulnessMatch ? parseInt(insightfulnessMatch[1]) : 2,
          evidenceEvaluation: evidenceMatch ? parseInt(evidenceMatch[1]) : 2
        };
        
        finalVerdict = scores.insightfulness + scores.evidenceEvaluation >= 8 ? 'ban_lifted' : 'ban_upheld';
        finalStatement = assessment;
      }
    }
    
    return NextResponse.json({
      fssaiResponse: fssaiResponse,
      gameEnded: gameEnded,
      scores: scores,
      finalVerdict: finalVerdict,
      finalStatement: finalStatement,
      success: true
    });

  } catch (error) {
    console.error('Error in food safety simulation analyze:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
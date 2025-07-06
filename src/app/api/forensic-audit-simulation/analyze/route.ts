import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FORENSIC_AUDIT_SIMULATION_PROMPT } from '@/utils/prompts';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { action, input, currentRound, interactions, caseTitle } = await request.json();
    
    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    let auditorResponse: string;
    
    // Handle hint requests
    if (action === 'get_hint') {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: FORENSIC_AUDIT_SIMULATION_PROMPT
          },
          {
            role: "system",
            content: "The CFO has requested a hint. Provide a brief, strategic hint that guides their investigation approach without revealing answers. Focus on procedural or analytical thinking."
          },
          {
            role: "user",
            content: `Case: ${caseTitle}
Round: ${currentRound}
Previous interactions: ${JSON.stringify(interactions)}

Generate a helpful hint for the CFO's investigation.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      auditorResponse = completion.choices[0]?.message?.content || "💡 Focus on the audit trail and timeline discrepancies in the evidence presented.";
      
    } else {
      // Handle CFO actions and responses
      const actionContext = {
        'request_excel_metadata': 'The CFO is requesting detailed Excel file metadata and forensic analysis.',
        'request_sap_logs': 'The CFO is requesting SAP system logs and user access audit trails.',
        'probe_vendor_gst': 'The CFO is investigating vendor GST compliance and registration details.',
        'challenge_emergency_approvals': 'The CFO is challenging the emergency approval procedures and authorization.',
        'submit_final_position': 'The CFO is submitting their final position on the audit findings.',
        'custom_response': 'The CFO has provided a custom response to the audit inquiry.'
      };

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: FORENSIC_AUDIT_SIMULATION_PROMPT
          },
          {
            role: "system",
            content: "You are the forensic auditor responding to the CFO's inquiry. Provide specific, technical evidence details that a real auditor would discover. Include timestamps, system IDs, amounts, and procedural violations. End with 'WHAT WOULD YOU LIKE TO REVIEW NEXT?' unless it's a final position submission."
          },
          {
            role: "user",
            content: `Case: ${caseTitle}
Round: ${currentRound}/5
CFO Action: ${action}
CFO Input: ${input || 'No additional input'}
Context: ${actionContext[action as keyof typeof actionContext] || 'CFO is investigating the audit findings'}

Previous conversation:
${interactions.map((int: any) => `${int.type.toUpperCase()}: ${int.content}`).join('\n')}

Generate the auditor's response with specific forensic evidence details.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      auditorResponse = completion.choices[0]?.message?.content || "Your inquiry has been noted. Please specify what aspect of the financial anomalies you would like to examine further.";
    }
    
    // Enhanced CFO engagement scoring
    let cfoScore = 0;
    const engagementActions = ['request_excel_metadata', 'request_sap_logs', 'probe_vendor_gst', 'challenge_emergency_approvals'];
    
    // Track unique engagement types
    const actionSet = new Set<string>();
    interactions.forEach((interaction: any) => {
      if (interaction.type === 'cfo') {
        engagementActions.forEach(engagementAction => {
          if (interaction.content.includes(engagementAction)) {
            actionSet.add(engagementAction);
          }
        });
      }
    });
    
    // Add current action if it's an engagement action
    if (engagementActions.includes(action)) {
      actionSet.add(action);
    }
    
    // Score based on breadth of investigation
    cfoScore = actionSet.size;
    
    // Additional scoring for quality of custom responses
    if (action === 'custom_response' && input) {
      const qualityIndicators = ['explain', 'challenge', 'verify', 'investigate', 'review', 'analyze', 'examine'];
      const hasQuality = qualityIndicators.some(indicator => 
        input.toLowerCase().includes(indicator)
      );
      if (hasQuality) {
        cfoScore += 0.5; // Bonus for thoughtful custom responses
      }
    }
    
    // Determine if game should end
    const gameEnded = currentRound >= 4 || action === 'submit_final_position';
    let outcome, finalStatement;
    
    if (gameEnded) {
      // Generate final assessment using AI
      try {
        const finalCompletion = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content: FORENSIC_AUDIT_SIMULATION_PROMPT
            },
            {
              role: "system",
              content: "Generate the final audit conclusion based on the CFO's investigation approach. Consider the breadth and depth of their inquiry."
            },
            {
              role: "user",
              content: `CFO Score: ${cfoScore}/4 investigation areas
Case: ${caseTitle}
Total Rounds: ${currentRound}

CFO Investigation Summary:
${interactions.filter((int: any) => int.type === 'cfo').map((int: any) => `- ${int.content}`).join('\n')}

Determine: 
1. Outcome: "escalation" or "internal_audit" 
2. Final statement explaining the decision

Respond in JSON format: {"outcome": "escalation|internal_audit", "finalStatement": "detailed explanation"}`
            }
          ],
          temperature: 0.6,
          max_tokens: 500,
        });

        const finalResponse = finalCompletion.choices[0]?.message?.content;
        if (finalResponse) {
          try {
            const finalData = JSON.parse(finalResponse);
            outcome = finalData.outcome;
            finalStatement = finalData.finalStatement;
          } catch (e) {
            // Fallback if JSON parsing fails
            const roundedScore = Math.floor(cfoScore);
            if (roundedScore <= 2) {
              outcome = 'escalation';
              finalStatement = `AUDIT CONCLUSION: CFO demonstrated insufficient financial skepticism. Investigation depth: ${roundedScore}/4 areas. Matter escalated under Section 143(12).`;
            } else {
              outcome = 'internal_audit';
              finalStatement = `AUDIT CONCLUSION: CFO demonstrated adequate investigation approach. Investigation depth: ${roundedScore}/4 areas. Internal audit recommended.`;
            }
          }
        }
      } catch (e) {
        // Fallback assessment
        const roundedScore = Math.floor(cfoScore);
        if (roundedScore <= 2) {
          outcome = 'escalation';
          finalStatement = `AUDIT CONCLUSION: CFO demonstrated insufficient financial skepticism. Investigation depth: ${roundedScore}/4 areas. Matter escalated under Section 143(12).`;
        } else {
          outcome = 'internal_audit';
          finalStatement = `AUDIT CONCLUSION: CFO demonstrated adequate investigation approach. Investigation depth: ${roundedScore}/4 areas. Internal audit recommended.`;
        }
      }
    }

    return NextResponse.json({
      auditorResponse,
      cfoScore: Math.round(cfoScore * 10) / 10,
      gameEnded,
      outcome,
      finalStatement
    });

  } catch (error) {
    console.error('Error in forensic audit analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FORENSIC_AUDIT_SIMULATION_PROMPT } from '@/utils/prompts';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Forensic Audit simulation generation...');

    const { action } = await request.json();
    
    if (action !== 'start_audit') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      // model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: FORENSIC_AUDIT_SIMULATION_PROMPT
        },
        {
          role: "user", 
          content: "Generate a new forensic audit scenario. Create a unique case with a company name, project type, and three specific financial anomalies from different domains (SAP/ERP manipulation, Vendor/GST irregularities, Manual documentation overrides). Include specific amounts in INR Cr format and provide an opening statement from the auditor to the CFO. Respond in JSON format with: caseTitle, keyAnomalies (array of 3 strings), and openingStatement."
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    console.log('OpenAI Response received:', response ? 'Success' : 'No response');

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // If JSON parsing fails, create a structured response from the text
      parsedResponse = {
        caseTitle: "Forensic Audit Investigation",
        keyAnomalies: [
          "Financial irregularity detected in system processing",
          "Vendor compliance verification required",
          "Manual override procedures under review"
        ],
        openingStatement: response
      };
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Error in forensic audit generation:', error);
    
    // Fallback response in case of API failure
    const fallbackResponse = {
      caseTitle: "Infrastructure Project Forensic Audit",
      keyAnomalies: [
        "INR 12.5 Cr invoice processing irregularities detected in ERP system",
        "Vendor GST compliance verification failed for multiple entities",
        "Emergency approval protocols bypassed without proper authorization"
      ],
      openingStatement: `A whistleblower complaint has triggered forensic investigation of recent project expenditures.

You are the CFO called to explain identified financial anomalies.

These irregularities require immediate clarification to prevent regulatory escalation.

WHAT WOULD YOU LIKE TO REVIEW NEXT?`
    };
    
    return NextResponse.json(fallbackResponse);
  }
} 
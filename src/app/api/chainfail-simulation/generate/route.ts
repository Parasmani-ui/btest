import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CHAINFAIL_SIMULATION_PROMPT } from '@/utils/prompts';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to clean up generated content
function cleanContent(content: string): string {
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
    console.log('Starting ChainFail simulation generation...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      // model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: CHAINFAIL_SIMULATION_PROMPT + "\n\nCRITICAL: Generate clean, simple text without any markdown formatting, asterisks, or special symbols. Use clear, professional language that is easy to read. ABSOLUTELY NO extra line breaks or spacing between paragraphs. Keep content compact and concise."
        },
        {
          role: "user", 
          content: "Generate a new industrial accident investigation case for training purposes. Use simple, clean formatting without any special symbols, extra line breaks, or unnecessary spacing. Keep content compact and easy to read."
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content;
    console.log('OpenAI Response received:', response ? 'Success' : 'No response');

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the content before sending to client
    const cleanedResponse = cleanContent(response);

    return NextResponse.json({
      success: true,
      data: cleanedResponse,
    });

  } catch (error) {
    console.error('Error in ChainFail simulation generation:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate simulation'
    }, { status: 500 });
  }
} 
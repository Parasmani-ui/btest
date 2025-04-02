import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const Config = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
}; 
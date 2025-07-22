import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant for Heritagebox, a premium media digitization service. Your role is to help customers with:

1. Photo digitization pricing and services
2. Video transfer options (8mm, VHS, Hi8, etc.)
3. Project status updates
4. Turnaround times and delivery methods
5. General digitization questions

Key Information:
- Photo scanning starts at $0.49 per photo
- Video transfer pricing varies by format
- Standard turnaround is 2-3 weeks
- Rush service available for 1 week turnaround
- We offer USB drive and cloud backup options
- All work is done in-house with professional equipment
- We handle fragile and damaged media with special care

Keep responses helpful, concise, and focused on digitization services. If asked about order status, recommend they provide their email or order number for specific details. For complex technical questions or special requests, suggest speaking with a human agent.

Do not provide specific pricing without knowing the exact service needed, but give general ranges and encourage getting a custom quote.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build conversation messages for OpenAI
    const messages: any[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ];

    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      if (msg.sender === 'user') {
        messages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.sender === 'bot') {
        messages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    });

    // Add the current message
    messages.push({
      role: 'user',
      content: message
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    res.json({ 
      success: true, 
      response: aiResponse,
      usage: completion.usage
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback response
    const fallbackResponse = "I apologize, but I'm having trouble processing your request right now. For immediate assistance with your digitization needs, please click the 'Talk to Human' button to connect with our team.";
    
    res.json({ 
      success: true, 
      response: fallbackResponse,
      fallback: true
    });
  }
}

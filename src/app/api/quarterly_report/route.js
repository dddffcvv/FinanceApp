import { NextResponse } from 'next/server';

export async function GET() {
  // Get your API key from environment variables
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ summary: 'API key not set.' }, { status: 500 });
  }

  try {
    // Make the POST request to DeepSeek (via OpenRouter)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528',
        messages: [
          {
            role: 'user',
            content: 'Please provide a quarterly financial report summary for a personal finance tracker. Highlight income, expenses, spending trends, and saving advice.',
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ summary: 'Failed to generate report.' }, { status: 500 });
    }

    const result = await response.json();
    const aiText = result?.choices?.[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ summary: aiText });

  } catch (error) {
    console.error('AI report error:', error);
    return NextResponse.json({ summary: 'Error generating report.' }, { status: 500 });
  }
}

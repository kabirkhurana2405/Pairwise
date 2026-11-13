import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { you, person } = await request.json();
    if (!you || !person?.display_name) {
      return NextResponse.json({ error: 'Both profiles are required.' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ mode: 'demo' });

    const prompt = `Create a thoughtful Pairwise chemistry note using ONLY these two self-described profiles.
Do not score or rank people. Do not infer sensitive traits, diagnose personality, or predict relationship success.
Be specific, kind, honest and concise. Describe possibilities, not certainties.
Return JSON with exactly these string keys:
headline: short editorial headline.
spark: 2-3 sentences explaining a plausible connection.
overlap: 2 sentences naming concrete shared interests or values.
difference: 2 sentences respectfully describing one difference worth discussing, or say the profiles do not reveal a clear tension.
opener: one natural, specific first-person opening question.
date: one practical first-date idea based on shared interests.
PROFILE A: ${JSON.stringify(you)}
PROFILE B: ${JSON.stringify(person)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'Return valid JSON only. Never use markdown fences.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });
    if (!response.ok) {
      console.error('OpenAI error:', await response.text());
      return NextResponse.json({ error: 'AI is temporarily unavailable. Please try again.' }, { status: 502 });
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: 'AI returned an empty response.' }, { status: 502 });
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not create the chemistry note.' }, { status: 500 });
  }
}

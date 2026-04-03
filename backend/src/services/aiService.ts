import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponse {
  title: string;
  body: string;
  tags: string[];
  suggestions: string;
}

export async function generateContent(prompt: string): Promise<AIResponse> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: '你是一个专业的内容创作助手，只输出 JSON，不要有其他文字。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content || '{}';

  let jsonStr = content;
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr) as AIResponse;
    return {
      title: parsed.title || '',
      body: parsed.body || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      suggestions: parsed.suggestions || '',
    };
  } catch (err) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI 内容生成失败，请稍后重试');
  }
}

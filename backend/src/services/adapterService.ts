import { AIResponse } from './aiService';

const ADAPTER_PROMPTS = {
  xiaohongshu: (content: AIResponse) => `
请将以下内容优化为小红书风格：

标题：${content.title}
正文：${content.body}
标签：${content.tags.join(', ')}

要求：
- 标题添加 emoji，使其更吸引人
- 正文增加生活化表达，像朋友分享
- 添加合适的 emoji
- 调整标签顺序，热门标签放前面
- 保持内容核心不变

输出 JSON：{ "title": "...", "body": "...", "tags": [...] }
`,
};

export async function adaptContent(
  content: AIResponse,
  platform: 'xiaohongshu' | 'douyin' | 'wechat' | 'bili' | 'weibo'
): Promise<AIResponse> {
  if (platform !== 'xiaohongshu') {
    return content;
  }

  const adapterPrompt = ADAPTER_PROMPTS[platform](content);

  const { generateContent } = await import('./aiService');
  return generateContent(adapterPrompt);
}

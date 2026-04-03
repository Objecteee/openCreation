export interface User {
  id: number;
  phone: string;
  nickname: string;
  points: number;
  created_at: Date;
}

export interface GenerateContentRequest {
  topic: string;
  platform: 'xiaohongshu' | 'douyin' | 'wechat' | 'bili' | 'weibo';
  extraInfo?: string;
}

export interface GeneratedContent {
  title: string;
  body: string;
  tags: string[];
  suggestions: string;
}

export interface AdaptedContent extends GeneratedContent {
  platform: string;
  adaptedAt: Date;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

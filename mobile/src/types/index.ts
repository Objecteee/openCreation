export interface User {
  id: number;
  phone: string;
  nickname: string;
  points: number;
}

export interface GeneratedContent {
  title: string;
  body: string;
  tags: string[];
  suggestions: string;
}

export type Platform = 'xiaohongshu' | 'douyin' | 'wechat' | 'bili' | 'weibo';

export interface PlatformOption {
  id: Platform;
  name: string;
  icon: string;
}

export interface Package {
  id: string;
  points: number;
  price: number;
  label: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

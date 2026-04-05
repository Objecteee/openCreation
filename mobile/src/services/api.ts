import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAppStore } from '../store/useAppStore';
import { ApiResponse, User, GeneratedContent, Package } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.17.104.76:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = useAppStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        const message = error.response?.data?.message || error.message || '请求失败';
        return Promise.reject(new Error(message));
      }
    );
  }

  async login(phone: string, password: string) {
    const res = await this.client.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      phone,
      password,
    });
    return res.data.data!;
  }

  async register(phone: string, password: string, nickname?: string) {
    const res = await this.client.post<ApiResponse<{ token: string; user: User }>>('/auth/register', {
      phone,
      password,
      nickname,
    });
    return res.data.data!;
  }

  async getProfile() {
    const res = await this.client.get<ApiResponse<User>>('/auth/profile');
    return res.data.data!;
  }

  async generateContent(topic: string, platform: string, extraInfo?: string) {
    const res = await this.client.post<ApiResponse<{ content: GeneratedContent; pointsRemaining: number }>>(
      '/content/generate',
      { topic, platform, extraInfo }
    );
    return res.data.data!;
  }

  async getContentHistory(page = 1, pageSize = 20) {
    const res = await this.client.get<ApiResponse<any>>('/content/history', {
      params: { page, pageSize },
    });
    return res.data.data!;
  }

  async getPackages() {
    const res = await this.client.get<ApiResponse<Package[]>>('/order/packages');
    return res.data.data!;
  }

  async recharge(packageId: string) {
    const res = await this.client.post<ApiResponse<{ points: number }>>('/order/recharge', { packageId });
    return res.data.data!;
  }

  async getTransactions() {
    const res = await this.client.get<ApiResponse<any[]>>('/order/transactions');
    return res.data.data!;
  }
}

export const api = new ApiService();

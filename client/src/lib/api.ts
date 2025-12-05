import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatRequest {
  message: string;
  conversationId?: string;
  pageUrl?: string;
  pageText?: string;
}

export interface ChatResponse {
  answer: string;
  sources?: string[];
  conversationId: string;
  modelUsed: string;
}

export interface ScraperRun {
  id: string;
  status: string;
  documentsFound?: number;
  chunksCreated?: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export const chatAPI = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const { data } = await api.post('/chat', request);
    return data;
  },
  
  getConversation: async (id: string) => {
    const { data } = await api.get(`/conversations/${id}`);
    return data;
  },
};

export const scraperAPI = {
  run: async () => {
    const { data } = await api.post('/scraper/run');
    return data;
  },
  
  getStatus: async (): Promise<ScraperRun> => {
    const { data } = await api.get('/scraper/status');
    return data;
  },
  
  getRuns: async () => {
    const { data } = await api.get('/scraper/runs');
    return data;
  },
};

export const settingsAPI = {
  get: async (key: string) => {
    const { data } = await api.get(`/settings/${key}`);
    return data;
  },
  
  set: async (key: string, value: any) => {
    const { data } = await api.post('/settings', { key, value });
    return data;
  },
};

export default api;

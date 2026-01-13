import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    return data;
  },
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export const pollApi = {
  getAll: async () => {
    const { data } = await api.get('/polls');
    return data;
  },
  create: async (title: string, options: string[]) => {
    const { data } = await api.post('/polls', { title, options });
    return data;
  },
};

export const voteApi = {
  vote: async (pollId: string, optionId: string) => {
    await api.post(`/votes/${pollId}`, { optionId });
  },
  checkVoted: async (pollId: string) => {
    const { data } = await api.get(`/votes/${pollId}/check`);
    return data;
  },
};

export default api;

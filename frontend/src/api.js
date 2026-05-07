import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete client.defaults.headers.common.Authorization;
};

export const api = {
  register: async (payload) => {
    const response = await client.post('/auth/register', payload);
    return response.data;
  },
  login: async (payload) => {
    const response = await client.post('/auth/login', payload);
    return response.data;
  },
  getMe: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },
  deleteMe: async () => {
    const response = await client.delete('/auth/me');
    return response.data;
  },
  getWorkingPrograms: async () => {
    const response = await client.get('/working-programs');
    return response.data;
  },
  getWorkingProgram: async (id) => {
    const response = await client.get(`/working-programs/${id}`);
    return response.data;
  },
  createWorkingProgram: async (payload) => {
    const response = await client.post('/working-programs', payload);
    return response.data;
  },
  updateWorkingProgram: async (id, payload) => {
    const response = await client.put(`/working-programs/${id}`, payload);
    return response.data;
  },
  deleteWorkingProgram: async (id) => {
    const response = await client.delete(`/working-programs/${id}`);
    return response.data;
  },
  getDefaultTemplate: async () => {
    const response = await client.get('/working-programs/template/default');
    return response.data;
  },
  getTeachers: async () => {
    const response = await client.get('/teachers');
    return response.data;
  },
  createTeacher: async (payload) => {
    const response = await client.post('/teachers', payload);
    return response.data;
  },
};

export const getPdfUrl = (id) => (
  `${API_BASE_URL.replace(/\/$/, '')}/working-programs/${id}/pdf`
);

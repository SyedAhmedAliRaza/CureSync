'use client';

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// -- Auth interceptor --------------------------------------------------------

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('curesync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('curesync_token');
      localStorage.removeItem('curesync_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// -- Auth --------------------------------------------------------------------

export async function signup(email, password, fullName) {
  const { data } = await api.post('/auth/signup', {
    email,
    password,
    full_name: fullName,
  });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore errors on logout
  }
  localStorage.removeItem('curesync_token');
  localStorage.removeItem('curesync_user');
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

// -- Chat --------------------------------------------------------------------

export async function sendChatMessage(message, history = [], sessionId = null, language = 'en') {
  const { data } = await api.post('/chat', { message, history, session_id: sessionId, language });
  return data;
}

export async function listChatSessions() {
  const { data } = await api.get('/chat/sessions');
  return data;
}

export async function getChatSession(sessionId) {
  const { data } = await api.get(`/chat/sessions/${sessionId}`);
  return data;
}

export async function deleteChatSession(sessionId) {
  await api.delete(`/chat/sessions/${sessionId}`);
}

// -- Interactions ------------------------------------------------------------

export async function checkInteractions(medicines, language = 'en') {
  const { data } = await api.post('/interactions/check', { medicines, language });
  return data;
}

// -- Drugs -------------------------------------------------------------------

export async function searchDrugs(query, limit = 10) {
  const { data } = await api.get('/drugs/search', { params: { q: query, limit } });
  return data;
}

export async function getDrug(drugId) {
  const { data } = await api.get(`/drugs/${drugId}`);
  return data;
}

export async function listAllDrugNames() {
  const { data } = await api.get('/drugs');
  return data;
}

// -- OCR / Prescription Scanning ---------------------------------------------

export async function scanPrescription(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/ocr/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
}

// -- Medications / Schedule --------------------------------------------------

export async function listMedications(activeOnly = true) {
  const { data } = await api.get('/medications', { params: { active_only: activeOnly } });
  return data;
}

export async function createMedication(medication) {
  const { data } = await api.post('/medications', medication);
  return data;
}

export async function updateMedication(medId, updates) {
  const { data } = await api.put(`/medications/${medId}`, updates);
  return data;
}

export async function deleteMedication(medId) {
  await api.delete(`/medications/${medId}`);
}

export async function deactivateMedication(medId) {
  const { data } = await api.post(`/medications/${medId}/deactivate`);
  return data;
}

export default api;

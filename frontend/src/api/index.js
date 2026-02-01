import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/?$/, '')
  : '/api';

const api = axios.create({ baseURL });

const DEFAULT_PAGE_SIZE = 20;

export async function getOsuPseudo(payload) {
  const token = localStorage.getItem('userToken') || '';
  const body = {
    ...payload,
    token,
    limit: payload.limit ?? DEFAULT_PAGE_SIZE,
    offset: payload.offset ?? 0,
  };
  const { data } = await api.post('/pseudo', body, {
    headers: { Authorization: token },
  });
  return data;
}

export async function sendPlaylist(payload) {
  const { data } = await api.post('/createPlaylist', payload);
  return data;
}

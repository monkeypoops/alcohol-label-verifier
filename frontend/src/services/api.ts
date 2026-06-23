import axios from 'axios';
import type { LabelResult } from '../types/label';

const api = axios.create({
  baseURL: '/api',
});

export const uploadLabel = async (file: File): Promise<LabelResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData);
  return response.data;
};
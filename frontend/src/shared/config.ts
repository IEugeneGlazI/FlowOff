export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:5277/api';

export const STORAGE_KEYS = {
  auth: 'flowoff.auth',
} as const;

// API Configuration
// Uses environment variable if set, otherwise defaults to production Railway URL
// For local development, set VITE_API_URL=http://localhost:3000 in .env.local

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prmx-rainfall-monitor-backend-production.up.railway.app';


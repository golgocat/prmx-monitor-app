// API Configuration
// Uses environment variable if set, otherwise defaults to production Railway URL
// For local development, set VITE_API_URL=http://localhost:3000 in .env.local

const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://prmx-rainfall-monitor-backend-production.up.railway.app';
// Remove trailing slash AND trailing /api to ensure we have the clean base URL
export const API_BASE_URL = RAW_API_URL.replace(/\/$/, '').replace(/\/api$/, '');

console.log('🔌 API Config:', { RAW_API_URL, API_BASE_URL });


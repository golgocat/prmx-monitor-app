# Deploy to Railway & Vercel

This guide explains how to deploy the PRMX Rainfall Monitor with a split architecture:
- **Backend**: Deployed on Railway (Node.js + MongoDB)
- **Frontend**: Deployed on Vercel (React + Vite)

## Prerequisites

1. GitHub account
2. Railway account (https://railway.app)
3. Vercel account (https://vercel.com)
4. MongoDB Atlas connection string
5. AccuWeather API key

## Part 1: Backend Deployment (Railway)

1. **Push to GitHub**: Ensure your code is pushed to GitHub.
2. **New Project on Railway**:
   - Go to Railway Dashboard -> New Project -> Deploy from GitHub repo.
   - Select your repository.
3. **Configure Root Directory**:
   - Go to Settings -> General -> Root Directory.
   - Set it to `/backend`.
4. **Configure Environment Variables**:
   - Go to Variables.
   - Add:
     - `MONGODB_URI`: Your MongoDB connection string.
     - `ACCUWEATHER_API_KEY`: Your API key.
     - `PORT`: `3000` (optional, usually auto-detected).
5. **Deploy**: Railway will redeploy with the new settings.
6. **Get URL**: Copy the public URL provided by Railway (e.g., `https://backend-production.up.railway.app`).

## Part 2: Frontend Deployment (Vercel)

1. **New Project on Vercel**:
   - Go to Vercel Dashboard -> Add New -> Project.
   - Import your GitHub repository.
2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: Edit and select `frontend`.
3. **Configure Environment Variables**:
   - Add `VITE_API_URL` with the value of your Railway Backend URL (from Part 1).
   - Example: `https://backend-production.up.railway.app/api` (Make sure to include `/api` if your backend routes are prefixed with it).
4. **Deploy**: Click Deploy.

## Local Development

To run the project locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
   This will install dependencies for both frontend and backend workspaces.

2. **Start Backend**:
   ```bash
   npm run dev:backend
   ```

3. **Start Frontend**:
   ```bash
   npm run dev:frontend
   ```

4. **Access**:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`


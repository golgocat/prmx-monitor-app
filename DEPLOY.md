# Deploy to Railway

This guide will help you deploy the PRMX Rainfall Monitor to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Your MongoDB Atlas connection string
3. Your AccuWeather API key

## Deployment Steps

### 1. Push to GitHub (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy on Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the Node.js app

### 3. Configure Environment Variables

In your Railway project dashboard:

1. Go to the "Variables" tab
2. Add the following environment variables:

```
MONGODB_URI=mongodb+srv://satorubito_db_user:<password>@cluster0.ud4kkhi.mongodb.net/?appName=Cluster0
ACCUWEATHER_API_KEY=your-accuweather-api-key
PORT=3000
```

**Important:** 
- Replace `<password>` with your actual MongoDB password
- Replace `your-accuweather-api-key` with your AccuWeather API key

### 4. Deploy

Railway will automatically deploy your app. You can monitor the deployment in the "Deployments" tab.

### 5. Access Your App

Once deployed, Railway will provide you with a public URL (e.g., `https://your-app.railway.app`).

## Notes

- The backend API will be available at the Railway URL
- The cron job will run automatically every hour
- Logs can be viewed in the Railway dashboard
- Environment variables are securely stored and not exposed in your code

## Troubleshooting

### MongoDB Connection Issues
- Ensure your MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allow from anywhere)
- Verify your connection string is correct
- Check that your MongoDB user has proper permissions

### App Not Starting
- Check the deployment logs in Railway
- Verify all environment variables are set correctly
- Ensure `package.json` has the correct start script

## Updating the App

To update your deployed app:

```bash
git add .
git commit -m "Your update message"
git push
```

Railway will automatically redeploy your app.

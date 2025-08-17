# 🚀 Deployment Guide - Drone Weather Analyzer

## Overview
This guide will help you deploy your drone weather analyzer online so friends can test it.

## 📋 Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)

## 🎯 Deployment Strategy
- **Frontend (React)**: Vercel
- **Backend (Node.js API)**: Railway

## Phase 1: Setup GitHub Repository

### 1. Create GitHub Repository
1. Go to https://github.com
2. Click "New repository"
3. Name: `drone-weather-analyzer`
4. Make it public
5. Click "Create repository"

### 2. Push Your Code
```bash
# In your project directory
git init
git add .
git commit -m "Initial commit - Drone Weather Analyzer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/drone-weather-analyzer.git
git push -u origin main
```

## Phase 2: Deploy Backend (Railway)

### 1. Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `drone-weather-analyzer` repository
6. Select the `server` folder as root directory

### 2. Configure Railway
1. In Railway dashboard, go to your project
2. Click "Settings" → "Environment"
3. Add environment variable:
   - `NODE_ENV` = `production`
4. Click "Deploy"

### 3. Get Your Backend URL
1. After deployment, go to "Settings" → "Domains"
2. Copy the generated URL (e.g., `https://your-app-name.railway.app`)
3. Save this URL - you'll need it for frontend deployment

## Phase 3: Deploy Frontend (Vercel)

### 1. Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Set root directory to `client`

### 2. Configure Environment Variables
1. In Vercel project settings
2. Go to "Environment Variables"
3. Add:
   - `REACT_APP_API_URL` = `https://your-backend-url.railway.app`
4. Click "Deploy"

### 3. Get Your Frontend URL
1. After deployment, Vercel will provide a URL
2. Example: `https://drone-weather-analyzer.vercel.app`

## Phase 4: Test Your Deployment

### 1. Test the Application
1. Visit your Vercel URL
2. Try searching for Norwegian locations
3. Test the weather analysis feature
4. Check the yearly statistics table

### 2. Share with Friends
Send them your Vercel URL and they can test:
- Location search
- Weather threshold settings
- Historical weather analysis
- Dark theme interface

## 🛠️ Alternative Deployment Options

### Option 2: Netlify + Railway
- **Frontend**: Netlify (similar to Vercel)
- **Backend**: Railway

### Option 3: All-in-One Platforms
- **Render**: Can host both frontend and backend
- **Heroku**: Full-stack deployment (has free tier limitations)

## 🔧 Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure backend allows your frontend domain
2. **API Not Found**: Check environment variable `REACT_APP_API_URL`
3. **Build Failures**: Check logs in deployment platform

### Environment Variables:
- **Development**: Uses `http://localhost:5000`
- **Production**: Uses Railway backend URL

## 📊 Monitoring
- **Railway**: Check logs for backend issues
- **Vercel**: Monitor frontend performance and errors

## 💰 Cost
- **Free Tier Limits**:
  - Railway: 500 hours/month, 1GB RAM
  - Vercel: Unlimited static sites, 100GB bandwidth

Your drone weather analyzer should handle many users within free tiers!

## 🎉 Success!
Once deployed, your friends can access:
- Real Norwegian weather data analysis
- Professional dark theme interface
- Historical yearly statistics
- Dual wind safety checks

Share the URL and start collecting feedback! 🌟


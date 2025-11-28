# Railway Deployment Guide

## Quick Setup

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit - Railway ready"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect and deploy

3. **Configure Environment Variables:**
   In Railway dashboard, add:
   - `NODE_ENV=production`
   - `PORT=3000` (Railway sets this automatically)
   - `DATABASE_URL=postgresql://...` (Railway can provision PostgreSQL)
   - `ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net`
   - `APP_URL=https://screenshare.transparentinsurance.net`

4. **Get Railway URL:**
   - Railway gives you: `your-app.railway.app`
   - Use this for DNS

5. **Point DNS:**
   - In Vercel/DNS, add CNAME:
   - Name: `screenshare`
   - Value: `your-app.railway.app`

## Build Process

Railway will:
1. Install dependencies in `server/`
2. Build shared package first
3. Build server
4. Start with `npm start`

## Database

Railway can provision PostgreSQL automatically, or you can use an external database.


# Quick Start - Environment Files

## ✅ Your Environment Files Are Ready!

All environment configuration files have been created with your settings:
- **Server:** `linkpellow@transparentinsurance.net`
- **Email:** `linkpellow@transparentinsurance.net`
- **Subdomain:** `screenshare.transparentinsurance.net`

## Files Created

1. **`server/env.production.template`** - Production environment template
2. **`server/env.development.template`** - Development environment template
3. **`scripts/create-env.sh`** - Helper script to create .env files
4. **`scripts/deploy-same-server.sh`** - Updated with your email/username

## Quick Setup (3 Steps)

### Step 1: Create .env File

```bash
cd /Users/linkpellow/Documents/usha
./scripts/create-env.sh production
```

This creates `server/.env` from the production template.

### Step 2: Update Database Password

```bash
nano server/.env
```

Change this line:
```env
DATABASE_URL=postgresql://usha_user:YOUR_DB_PASSWORD@localhost:5432/usha
```

Replace `YOUR_DB_PASSWORD` with your actual PostgreSQL password.

### Step 3: Deploy to Server

**Option A: Upload .env file**
```bash
scp server/.env linkpellow@transparentinsurance.net:/opt/usha/server/.env
```

**Option B: Create on server directly**
```bash
ssh linkpellow@transparentinsurance.net
cd /opt/usha/server
cp env.production.template .env
nano .env  # Update password
```

## What's Already Configured

✅ **NODE_ENV=production**  
✅ **PORT=3000**  
✅ **HOST=0.0.0.0**  
✅ **ALLOWED_ORIGINS** - Both domains configured  
✅ **APP_URL** - Subdomain configured  
✅ **Email** - linkpellow@transparentinsurance.net (for SSL)

## What You Need to Update

⚠️ **DATABASE_URL** - Replace `YOUR_DB_PASSWORD` with your actual password

## Verification

After creating `.env`, verify it's correct:

```bash
# Check .env exists
test -f server/.env && echo "✅ .env file exists" || echo "❌ .env file missing"

# View (without showing password)
grep -v PASSWORD server/.env
```

## Deployment Script

The deployment script is already configured with your email:

```bash
./scripts/deploy-same-server.sh
```

This will:
- Build the application
- Create deployment package
- Include environment templates
- Use `linkpellow@transparentinsurance.net` for SSL setup

## Next Steps

1. ✅ Environment files created
2. ⏭️ Create `.env` with your database password
3. ⏭️ Deploy to server
4. ⏭️ Set up SSL certificate (email already configured)

---

**Ready to deploy!** Just update the database password and you're good to go.


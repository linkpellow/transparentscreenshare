# Environment Files Summary

## Your Environment Files

All environment configuration files are ready for deployment to `screenshare.transparentinsurance.net`.

### Production Template
**File:** `server/env.production.template`
- **Purpose:** Production environment for `screenshare.transparentinsurance.net`
- **Server location:** `/opt/usha/server/.env` (copy template and rename)
- **Email configured:** `linkpellow@transparentinsurance.net`

### Development Template
**File:** `server/env.development.template`
- **Purpose:** Local development environment
- **Usage:** Copy to `server/.env` for local testing

## Quick Setup

### Create Production .env File

**Option 1: Using the helper script**
```bash
cd /Users/linkpellow/Documents/usha
./scripts/create-env.sh production
# Then edit server/.env with your database password
```

**Option 2: Manual copy**
```bash
cd server
cp env.production.template .env
nano .env  # Update DATABASE_URL with your password
```

### Deploy to Server

After creating `.env` locally, upload it to your server:

```bash
# From your local machine
scp server/.env linkpellow@transparentinsurance.net:/opt/usha/server/.env
```

Or create it directly on the server:

```bash
# SSH into server
ssh linkpellow@transparentinsurance.net

# On server
cd /opt/usha/server
cp env.production.template .env
nano .env  # Update DATABASE_URL with your password
```

## Required Configuration

Update these values in your `.env` file:

1. **DATABASE_URL** (Required)
   ```env
   DATABASE_URL=postgresql://usha_user:YOUR_ACTUAL_PASSWORD@localhost:5432/usha
   ```

2. **Verify ALLOWED_ORIGINS** (Already configured)
   ```env
   ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net,https://transparentinsurance.net
   ```

3. **Verify APP_URL** (Already configured)
   ```env
   APP_URL=https://screenshare.transparentinsurance.net
   ```

## Current Configuration

✅ **Server User:** `linkpellow`  
✅ **Server Host:** `transparentinsurance.net`  
✅ **Email:** `linkpellow@transparentinsurance.net`  
✅ **Subdomain:** `screenshare.transparentinsurance.net`  
✅ **Port:** `3000`  
✅ **CORS Origins:** Configured for both domains

## Files Created

- ✅ `server/env.production.template` - Production template
- ✅ `server/env.development.template` - Development template
- ✅ `scripts/create-env.sh` - Helper script to create .env files
- ✅ `ENV_FILES_README.md` - Detailed documentation

## Next Steps

1. **Create your .env file:**
   ```bash
   ./scripts/create-env.sh production
   ```

2. **Update database password:**
   ```bash
   nano server/.env
   # Change YOUR_DB_PASSWORD to your actual password
   ```

3. **Deploy to server:**
   ```bash
   scp server/.env linkpellow@transparentinsurance.net:/opt/usha/server/.env
   ```

4. **Or create on server directly:**
   ```bash
   ssh linkpellow@transparentinsurance.net
   cd /opt/usha/server
   cp env.production.template .env
   nano .env  # Update password
   ```

---

**All environment files are ready!** Just update the database password and you're good to go.


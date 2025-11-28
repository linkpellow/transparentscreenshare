# Environment Files Guide

This directory contains environment configuration templates for different deployment scenarios.

## Files

### `.env.production`
Production environment template for `screenshare.transparentinsurance.net`.
- **Location on server:** `/opt/usha/server/.env`
- **Usage:** Copy to `.env` on your server and update with actual database credentials

### `.env.development`
Development environment template for local development.
- **Usage:** Copy to `.env` in `server/` directory for local testing

### `.env.example`
Generic example file showing all available environment variables.
- **Usage:** Reference for understanding all configuration options

## Quick Setup

### For Production Deployment

1. On your server, copy the production template:
   ```bash
   cd /opt/usha/server
   cp .env.production .env
   ```

2. Edit with your actual values:
   ```bash
   nano .env
   ```

3. Update at minimum:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - Verify `ALLOWED_ORIGINS` matches your domains
   - Verify `APP_URL` matches your subdomain

### For Local Development

1. Copy the development template:
   ```bash
   cd server
   cp .env.development .env
   ```

2. Update database URL if needed:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/usha_dev
   ```

## Required Variables (Production)

- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string (required)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `APP_URL` - Your application URL

## Optional Variables

- `AWS_*` - For S3 cloud storage (if not using local storage)
- `JWT_SECRET` - For authentication (future feature)
- `DB_*` - Individual database variables (alternative to DATABASE_URL)

## Security Notes

⚠️ **Never commit `.env` files to version control!**

- `.env` files are in `.gitignore`
- Only commit `.env.example`, `.env.production`, `.env.development` templates
- Always use strong passwords for production
- Rotate secrets regularly

## Database URL Format

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://usha_user:secure_password123@localhost:5432/usha
```

## Verification

After setting up `.env`, test the configuration:

```bash
cd /opt/usha/server
node -e "require('dotenv').config(); console.log('DB:', process.env.DATABASE_URL ? 'Set' : 'Missing');"
```

---

**For deployment instructions, see `DEPLOY_SAME_SERVER.md`**


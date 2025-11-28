# Railway Setup Complete! 🚀

Your server is deployed at: **https://web-production-23067.up.railway.app/**

## Next Steps

### 1. Configure Environment Variables in Railway

Go to your Railway project dashboard → **Variables** tab and add:

```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net,https://transparentinsurance.net
APP_URL=https://screenshare.transparentinsurance.net
RECORDING_STORAGE_PATH=./recordings
```

**For Database:**
- Railway can provision PostgreSQL automatically
- Or add your existing `DATABASE_URL` if you have one
- Format: `postgresql://user:password@host:port/database`

### 2. Point DNS to Railway

In your DNS provider (Vercel/DNS settings):

**Add CNAME record:**
- **Name:** `screenshare`
- **Value:** `web-production-23067.up.railway.app`
- **TTL:** 3600 (or default)

### 3. Test the Server

After setting environment variables, Railway will automatically redeploy.

Test endpoints:
- Health: `https://web-production-23067.up.railway.app/health`
- Should return: `{"status":"ok",...}`

### 4. Update Extension (if needed)

The extension is already configured to use `https://screenshare.transparentinsurance.net`

Once DNS propagates (5-10 minutes), it will work automatically!

## Troubleshooting

**If you get 404 errors:**
1. Check Railway logs for errors
2. Verify environment variables are set
3. Make sure the server process is running

**If database connection fails:**
1. Provision PostgreSQL in Railway (Add Service → Database → PostgreSQL)
2. Copy the `DATABASE_URL` from Railway
3. Add it to environment variables

## Current Status

✅ Server deployed to Railway  
⏳ Environment variables need to be configured  
⏳ DNS needs to be pointed to Railway  
⏳ Database needs to be set up  

---

**Your Railway URL:** https://web-production-23067.up.railway.app/


# Fix Extension Connection Error

## Error
```
Error creating session on server: TypeError: Failed to fetch
GET http://localhost:3000/api/sessions/... net::ERR_CONNECTION_REFUSED
```

## Problem

The extension is trying to connect to `localhost:3000` (development server) instead of your production server at `https://screenshare.transparentinsurance.net`.

## Quick Fix (2 Methods)

### Method 1: Configure via Extension UI (Easiest)

1. **Open the extension popup** (click the extension icon in your browser)
2. **Find the "Server URL" field** in the session controls
3. **Enter your production URL:**
   ```
   https://screenshare.transparentinsurance.net
   ```
4. **Click the save button** (💾 icon)
5. **Try sharing again**

### Method 2: Update Default in Code (Permanent)

If you want the extension to default to production, update the code:

**File:** `extension/src/popup.ts` (line ~120)
```typescript
const serverUrl = config.serverUrl || 'https://screenshare.transparentinsurance.net';
```

**File:** `extension/src/background.ts` (line ~204)
```typescript
const serverUrl = config.serverUrl || 'https://screenshare.transparentinsurance.net';
```

Then rebuild:
```bash
cd extension
npm run build
```

Then reload the extension in Chrome.

## Verification

After configuring:

1. **Open extension popup**
2. **Check Server URL field** - should show `https://screenshare.transparentinsurance.net`
3. **Start sharing** - should connect successfully

## Still Getting Errors?

### Check 1: Server is Running
```bash
curl https://screenshare.transparentinsurance.net/health
# Should return: {"status":"ok",...}
```

### Check 2: CORS Configuration
The server must allow requests from the extension. Check your `.env` file:
```env
ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net,https://transparentinsurance.net
```

### Check 3: SSL Certificate
Make sure SSL is properly configured:
```bash
curl -I https://screenshare.transparentinsurance.net/health
# Should return 200 OK
```

### Check 4: Extension Storage
The extension stores the server URL in Chrome's local storage. To verify:

1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Click "Local Storage" → `chrome-extension://[your-extension-id]`
4. Look for `serverUrl` key
5. Should be: `https://screenshare.transparentinsurance.net`

## Quick Test

After configuring, test the connection:

1. Open extension popup
2. Click "Share Screen"
3. Check browser console (F12) for errors
4. Should see successful connection messages

---

**Most likely fix:** Just enter `https://screenshare.transparentinsurance.net` in the Server URL field and click save! 💾


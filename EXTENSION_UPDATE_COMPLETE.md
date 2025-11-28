# Extension Update Complete ✅

## Changes Made

All extension files have been updated to use the production server URL by default:

**Updated Files:**
- ✅ `extension/src/popup.ts` - Default server URL updated
- ✅ `extension/src/background.ts` - Default server URL updated (2 instances)
- ✅ `extension/src/recording.ts` - Default server URL updated
- ✅ `extension/popup.html` - Placeholder text updated
- ✅ Extension rebuilt with new defaults

## New Default Server URL

**Before:** `http://localhost:3000`  
**After:** `https://screenshare.transparentinsurance.net`

## Next Steps

### 1. Reload Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Find the Usha extension
4. Click the **reload** button (🔄)
5. Or toggle it off and on

### 2. Verify Configuration

1. Click the extension icon to open popup
2. Check the "Server URL" field
3. Should show: `https://screenshare.transparentinsurance.net`
4. If it shows `localhost:3000`, click the save button (💾) to update it

### 3. Test Connection

1. Click "Share Screen" in the extension
2. Check browser console (F12) for errors
3. Should see successful connection to `screenshare.transparentinsurance.net`
4. No more `ERR_CONNECTION_REFUSED` errors

## What Changed

### Code Updates

All instances of:
```typescript
const serverUrl = config.serverUrl || 'http://localhost:3000';
```

Changed to:
```typescript
const serverUrl = config.serverUrl || 'https://screenshare.transparentinsurance.net';
```

### Files Updated

1. **popup.ts** - Load server URL function
2. **popup.ts** - Fetch viewer count function  
3. **background.ts** - Initialize WebRTC function
4. **background.ts** - Create session function
5. **recording.ts** - Upload recording function
6. **popup.html** - Input placeholder

## Verification

After reloading the extension:

✅ **Server URL field** shows production URL  
✅ **No connection errors** in console  
✅ **Sessions create successfully**  
✅ **Viewer count updates** correctly  

## Troubleshooting

### Still Seeing localhost:3000?

1. **Clear extension storage:**
   - Open Chrome DevTools (F12)
   - Go to Application tab
   - Local Storage → Extension
   - Delete `serverUrl` key
   - Reload extension

2. **Manually set URL:**
   - Open extension popup
   - Enter: `https://screenshare.transparentinsurance.net`
   - Click save (💾)

### Still Getting Connection Errors?

1. **Verify server is running:**
   ```bash
   curl https://screenshare.transparentinsurance.net/health
   ```

2. **Check CORS settings:**
   - Server `.env` should have:
   ```env
   ALLOWED_ORIGINS=https://screenshare.transparentinsurance.net,https://transparentinsurance.net
   ```

3. **Check SSL certificate:**
   ```bash
   curl -I https://screenshare.transparentinsurance.net/health
   ```

---

**Status:** ✅ Extension updated and rebuilt  
**Action Required:** Reload extension in Chrome


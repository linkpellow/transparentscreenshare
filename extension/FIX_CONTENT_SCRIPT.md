# Fix: "Could not load javascript 'content.js' for script"

## Quick Fix Steps

### Step 1: Verify Files Exist
```bash
cd /Users/linkpellow/Documents/usha/extension/dist
ls -la content.js manifest.json
```

Both files should exist. If not, rebuild:
```bash
cd /Users/linkpellow/Documents/usha/extension
npm run build
```

### Step 2: Remove Extension from Chrome
1. Open Chrome
2. Go to `chrome://extensions/`
3. Find "Usha Screen Sharing"
4. Click **Remove** (trash icon)
5. Confirm removal

### Step 3: Clear Chrome Cache (Optional)
1. Close all Chrome windows
2. Reopen Chrome

### Step 4: Reload Extension
1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Navigate to: `/Users/linkpellow/Documents/usha/extension/dist`
5. Select the `dist` folder
6. Click **Select**

### Step 5: Verify Loading
- Check for any red error messages
- The extension should appear in the list
- Click the extension icon to test

## If Still Not Working

### Check Chrome Console
1. Go to `chrome://extensions/`
2. Find your extension
3. Click **"service worker"** link (if available)
4. Check for errors in the console

### Verify Content Script
1. Open any website (e.g., google.com)
2. Press F12 to open DevTools
3. Go to Console tab
4. Type: `chrome.runtime.id`
5. Should return the extension ID (not undefined)

### Manual Verification
Check if content.js is valid:
```bash
cd /Users/linkpellow/Documents/usha/extension/dist
node -e "console.log('File is valid JavaScript')" < content.js || echo "File has syntax errors"
```

## Common Causes

1. **Cached Extension**: Chrome cached a broken version
   - Solution: Remove and re-add extension

2. **Wrong Directory**: Loading from wrong folder
   - Solution: Make sure to load from `extension/dist`, not `extension/`

3. **File Permissions**: Files not readable
   - Solution: `chmod 644 extension/dist/*.js extension/dist/manifest.json`

4. **Incomplete Build**: Build didn't complete
   - Solution: Rebuild with `npm run build`

## Verification Checklist

- [ ] `content.js` exists in `extension/dist/`
- [ ] `manifest.json` exists in `extension/dist/`
- [ ] Extension removed from Chrome
- [ ] Extension reloaded from `extension/dist`
- [ ] No error messages in Chrome extensions page
- [ ] Extension icon appears in toolbar

## Still Having Issues?

The extension is built correctly. If Chrome still can't load it:

1. Try a different Chrome profile
2. Try Chrome Canary or another Chromium browser
3. Check Chrome version (should be recent)
4. Disable other extensions temporarily
5. Check Chrome's extension error logs


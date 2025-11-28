# Troubleshooting Extension Loading Issues

## Error: "Could not load javascript 'content.js' for script"

### Solution 1: Reload the Extension

1. Go to `chrome://extensions/`
2. Find "Usha Screen Sharing"
3. Click the **reload** icon (circular arrow)
4. Check if the error persists

### Solution 2: Remove and Re-add Extension

1. Go to `chrome://extensions/`
2. Click **Remove** on the Usha extension
3. Click **Load unpacked** again
4. Select `/Users/linkpellow/Documents/usha/extension/dist`

### Solution 3: Verify File Exists

```bash
cd /Users/linkpellow/Documents/usha/extension/dist
ls -la content.js
# Should show: -rw-r--r-- ... content.js
```

If file doesn't exist, rebuild:
```bash
cd /Users/linkpellow/Documents/usha/extension
npm run build
```

### Solution 4: Check File Permissions

```bash
cd /Users/linkpellow/Documents/usha/extension/dist
chmod 644 content.js manifest.json
```

### Solution 5: Clear Chrome Extension Cache

1. Close all Chrome windows
2. Delete Chrome's extension cache (if needed)
3. Reload extension

### Solution 6: Check Browser Console

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for any JavaScript errors
4. Check for CSP (Content Security Policy) violations

### Solution 7: Verify Manifest

The manifest.json should have:
```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }
]
```

Verify in dist folder:
```bash
cd /Users/linkpellow/Documents/usha/extension/dist
cat manifest.json | grep -A 5 content_scripts
```

### Solution 8: Rebuild from Scratch

```bash
cd /Users/linkpellow/Documents/usha/extension
rm -rf dist node_modules
npm install
npm run build
```

Then reload extension in Chrome.

## Common Issues

### Issue: Extension loads but content script doesn't run
- Check if content script is injected on the page
- Open DevTools on any webpage
- Check Console for errors
- Verify content script has proper permissions

### Issue: "Manifest file is missing or unreadable"
- Make sure you're loading from `extension/dist`, not `extension/`
- Verify `manifest.json` exists in dist folder
- Check file permissions

### Issue: Icons not showing
- Verify PNG files exist: `ls extension/dist/icons/*.png`
- Regenerate if needed: `cd extension && node generate-icons.js && npm run build`

## Still Having Issues?

1. Check Chrome's extension error page: `chrome://extensions/`
2. Look for red error messages
3. Click "Errors" button if available
4. Check the detailed error message


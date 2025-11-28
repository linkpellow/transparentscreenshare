# How to Load the Extension

## Important: Load from the correct directory!

You must load the extension from the **`extension/dist`** directory, NOT from the root `usha` directory.

## Steps

1. **Build the extension** (if you haven't already):
   ```bash
   cd extension
   npm run build
   ```

2. **Open Chrome Extensions page**:
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**:
   - Click "Load unpacked" button
   - **Navigate to**: `/Users/linkpellow/Documents/usha/extension/dist`
   - Select the `dist` folder and click "Select"

5. **Verify**:
   - You should see "Usha Screen Sharing" extension in the list
   - The extension icon should appear in your Chrome toolbar

## Troubleshooting

### "Manifest file is missing or unreadable"
- Make sure you're loading from `extension/dist`, not the root directory
- Verify `manifest.json` exists in the `dist` folder
- Rebuild the extension: `cd extension && npm run build`

### "Icons are missing" warning
- This is okay for development
- The extension will still work
- To fix: Add icon files (16x16, 48x48, 128x128 PNG) to `extension/icons/` and rebuild

### Extension not appearing
- Check the browser console for errors
- Make sure all files were built correctly
- Try reloading the extension (click the refresh icon)

## Quick Path

The absolute path to load:
```
/Users/linkpellow/Documents/usha/extension/dist
```


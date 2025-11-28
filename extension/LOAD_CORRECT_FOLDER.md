# ⚠️ IMPORTANT: Load the Correct Folder!

## The Problem

You're trying to load from the **wrong directory**:
- ❌ **WRONG**: `~/Documents/usha` (root folder)
- ✅ **CORRECT**: `~/Documents/usha/extension/dist` (built extension folder)

## Why This Happens

Chrome extensions must be loaded from the folder that contains:
- `manifest.json` (the extension manifest)
- All the built JavaScript files
- Icons and other assets

The `manifest.json` is **NOT** in the root `usha` folder - it's in `extension/dist/`.

## Correct Loading Steps

### Step 1: Open Chrome Extensions
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)

### Step 2: Click "Load unpacked"

### Step 3: Navigate to the CORRECT folder
**You must navigate to:**
```
/Users/linkpellow/Documents/usha/extension/dist
```

**NOT:**
```
/Users/linkpellow/Documents/usha  ← This is WRONG!
```

### Step 4: Select the `dist` folder
- Navigate into `usha` folder
- Then into `extension` folder  
- Then into `dist` folder
- **Select the `dist` folder** (it should contain `manifest.json`)

### Step 5: Verify
After selecting, you should see:
- Extension name: "Usha Screen Sharing"
- No error messages
- Extension icon appears

## Visual Guide

```
Documents/
└── usha/                    ← DON'T select this!
    ├── extension/
    │   ├── src/            ← DON'T select this!
    │   ├── dist/           ← ✅ SELECT THIS FOLDER!
    │   │   ├── manifest.json  ← This file must be here
    │   │   ├── background.js
    │   │   ├── content.js
    │   │   ├── popup.js
    │   │   └── icons/
    │   └── package.json
    ├── server/
    └── viewer/
```

## Quick Verification

Before loading, verify the folder is correct:

```bash
cd /Users/linkpellow/Documents/usha/extension/dist
ls manifest.json
```

If you see `manifest.json`, you're in the right place!

If you get "No such file or directory", you're in the wrong folder.

## Common Mistakes

1. **Selecting root folder**: `~/Documents/usha`
   - ❌ No manifest.json here
   
2. **Selecting extension folder**: `~/Documents/usha/extension`
   - ❌ Manifest is in `dist/` subfolder
   
3. **Selecting src folder**: `~/Documents/usha/extension/src`
   - ❌ This is source code, not built extension

## The Correct Path

The **absolute path** you need to select:
```
/Users/linkpellow/Documents/usha/extension/dist
```

Or in Finder:
1. Open Finder
2. Navigate to Documents → usha → extension → dist
3. Select the `dist` folder
4. Click "Select" in Chrome

## Still Confused?

Run this command to see the correct path:
```bash
echo "Load this folder in Chrome:"
echo "/Users/linkpellow/Documents/usha/extension/dist"
echo ""
echo "Verify it exists:"
ls -la /Users/linkpellow/Documents/usha/extension/dist/manifest.json
```

If the last command shows the manifest file, that's the folder to load!


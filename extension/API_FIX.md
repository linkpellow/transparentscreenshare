# Fixed: chooseDesktopMedia API Signature Error

## Error
```
Error in invocation of desktopCapture.chooseDesktopMedia(array sources, optional tabs.Tab targetTab, optional object options, function callback): No matching signature.
```

## Problem
The `chooseDesktopMedia` API was being called with incorrect parameters. The `targetTab` parameter, while optional, was causing signature mismatches in some Chrome versions.

## Solution
Simplified the API call to use the two-parameter form:
- `chooseDesktopMedia(sources, callback)`

This is the most compatible form and works reliably across Chrome versions.

## Changes Made

**Before:**
```typescript
chrome.desktopCapture.chooseDesktopMedia(
  sources,
  targetTab,  // This was causing the error
  callback
);
```

**After:**
```typescript
chrome.desktopCapture.chooseDesktopMedia(
  sources,
  callback  // Simplified - targetTab is optional and not needed
);
```

## Notes
- The `targetTab` parameter is optional and not required for basic functionality
- The tab ID is still stored in `activeTabId` for content script communication
- This simpler form is more compatible across Chrome versions

## Testing
After rebuilding and reloading the extension:
1. Click extension icon
2. Choose a share type
3. Should see screen picker without signature errors
4. Select screen/window/tab
5. Should work correctly

## Rebuild Required
```bash
cd /Users/linkpellow/Documents/usha/extension
npm run build
```

Then reload the extension in Chrome.


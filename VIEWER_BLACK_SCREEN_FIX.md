# Viewer Black Screen Fix

## Issues Identified

### 1. DNS Not Resolving (ERR_NAME_NOT_RESOLVED)
**Status:** Infrastructure issue (needs DNS configuration)
**Impact:** Users can't reach the viewer page

### 2. Black Screen in Viewer
**Status:** Fixed with code improvements
**Causes:**
- Video autoplay policy restrictions
- Missing explicit `play()` call
- No error handling for playback failures
- Insufficient debugging/logging

## Fixes Applied

### 1. Explicit Video Playback ✅
```typescript
// Before: Just set srcObject
remoteVideo.srcObject = remoteStream;

// After: Explicit play() with error handling
await remoteVideo.play();
```

### 2. Autoplay Policy Handling ✅
- Added try/catch for `play()` call
- Fallback: Click-to-play if autoplay fails
- User-friendly error messages

### 3. Better Error Handling ✅
- DNS/network error detection
- Specific error messages
- Reload button for easy recovery

### 4. Enhanced Debugging ✅
- Console logging for WebRTC states
- ICE connection state tracking
- Stream track information logging
- WebSocket URL logging

### 5. Video Element Styling ✅
- Explicit width/height: 100%
- Background color: black
- Display: block
- Ensures video is visible when stream arrives

### 6. Connection State Tracking ✅
- WebRTC connection state monitoring
- ICE connection state monitoring
- Better status indicators
- Error messages for connection failures

## New Features

### Error Messages
- **DNS Error:** "Cannot connect to server. Please check DNS configuration"
- **Network Error:** "Network connection failed. The host may be behind a firewall"
- **Playback Error:** "Unable to play video. Please click to start playback"

### Debug Logging
- WebSocket URL construction
- WebRTC connection states
- ICE connection states
- Stream track information
- Video playback status

### User Experience
- Reload button in error messages
- Click-to-play fallback
- Better visual feedback
- Connection status indicators

## Testing Checklist

- [ ] Video plays automatically when stream arrives
- [ ] Click-to-play works if autoplay fails
- [ ] Error messages display correctly
- [ ] Connection states update properly
- [ ] Debug logs appear in console
- [ ] Video element is visible (not black)

## Remaining Infrastructure Issues

### DNS Configuration
The domain `screenshare.transparentinsurance.net` needs:
1. DNS A record pointing to server IP
2. Wait for DNS propagation (15 min - 24 hours)
3. Verify with: `nslookup screenshare.transparentinsurance.net`

### SSL Certificate
After DNS resolves:
1. Install SSL certificate: `sudo certbot --nginx -d screenshare.transparentinsurance.net`
2. Verify HTTPS works
3. Test WebSocket (WSS) connection

## Expected Behavior After Fixes

### When Stream Arrives
1. ✅ Video element receives stream
2. ✅ `play()` is called explicitly
3. ✅ Video starts playing automatically
4. ✅ Loading overlay disappears
5. ✅ Video is visible (not black)

### If Autoplay Fails
1. ✅ Error message displayed
2. ✅ User can click to play
3. ✅ Video plays on user interaction

### If Connection Fails
1. ✅ Specific error message
2. ✅ Reload button available
3. ✅ Debug info in console

---

**Status:** ✅ Code fixes applied
**Next Steps:** Configure DNS and SSL on server


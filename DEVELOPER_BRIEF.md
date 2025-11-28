# Screen Sharing Service - Developer Brief

## Overview

We're deploying a screen sharing service that will run on a **separate subdomain** from the main transparentinsurance.net website. This service is completely independent and requires **no code changes** to the main website.

## Subdomain Setup

**Service URL:** `screenshare.transparentinsurance.net`

This subdomain will host a separate Node.js application for screen sharing functionality. It does not affect the main website at `transparentinsurance.net`.

## What We Need from You

### 1. DNS Configuration (Required)

Please add a DNS record for the subdomain:

**Option A: A Record (Direct IP)**
```
Type: A
Name: screenshare
Value: [SERVER_IP_ADDRESS]
TTL: 3600 (or your standard)
```

**Option B: CNAME (If using hostname)**
```
Type: CNAME
Name: screenshare
Value: [YOUR_SERVER_HOSTNAME]
TTL: 3600 (or your standard)
```

**Note:** We'll provide the server IP address or hostname once the server is ready.

### 2. SSL Certificate (Required)

After DNS is configured, we'll need an SSL certificate for HTTPS. This can be done via:
- Let's Encrypt (free, automated)
- Your existing certificate provider
- Or we can handle it if you provide server access

### 3. That's It!

No other changes needed. The main website continues to work normally.

## Technical Details (For Reference)

### Architecture

- **Main Site:** `transparentinsurance.net` - No changes needed ✅
- **Screen Sharing:** `screenshare.transparentinsurance.net` - New subdomain
- **Technology:** Node.js + Express server
- **Protocol:** HTTPS/WSS (secure WebSocket)

### What the Service Does

1. Hosts a web viewer (HTML/CSS/JS)
2. Provides WebSocket signaling for WebRTC
3. Manages screen sharing sessions
4. Handles API requests

### Server Requirements

- Node.js 18+
- Ports: 80 (HTTP), 443 (HTTPS)
- PostgreSQL database (optional, can be configured separately)
- ~200MB disk space for application files

## DNS Propagation

After DNS is configured:
- **Typical:** 15 minutes - 2 hours
- **Maximum:** Up to 24 hours
- **Check:** Use `nslookup screenshare.transparentinsurance.net` or online DNS checkers

## Security Considerations

- ✅ Separate subdomain (isolated from main site)
- ✅ HTTPS/WSS required (secure connections)
- ✅ CORS configured for specific origins
- ✅ No access to main site code/database
- ✅ Independent deployment

## Timeline

1. **DNS Configuration:** ~15 minutes (your side)
2. **DNS Propagation:** 15 min - 2 hours
3. **SSL Setup:** ~10 minutes (after DNS)
4. **Service Deployment:** We handle this
5. **Testing:** ~30 minutes

**Total:** Usually 1-2 hours from DNS configuration

## Support

If you have questions or need clarification:
- DNS configuration questions
- SSL certificate setup
- Server access requirements
- Timeline coordination

## FAQ

**Q: Will this affect the main website?**  
A: No. It's a completely separate subdomain with its own server.

**Q: Do we need to change any code on transparentinsurance.net?**  
A: No. Zero code changes needed.

**Q: What if DNS propagation takes longer?**  
A: That's normal. We'll test once propagation is complete.

**Q: Can we use a different subdomain?**  
A: Yes, but `screenshare.transparentinsurance.net` is already configured. If you prefer a different name, we can update.

**Q: What about SSL certificate renewal?**  
A: If using Let's Encrypt, it auto-renews. Otherwise, we'll coordinate renewal.

## Next Steps

1. **You:** Add DNS record for `screenshare.transparentinsurance.net`
2. **You:** Provide server IP or confirm CNAME target
3. **Us:** Deploy application files
4. **Us:** Configure SSL certificate
5. **Us:** Test and verify everything works

---

**Contact:** [Your contact info]  
**Service:** Screen Sharing for transparentinsurance.net  
**Status:** Ready for DNS configuration


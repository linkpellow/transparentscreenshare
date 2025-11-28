# Screen Sharing Service - Setup Instructions

## Quick Summary

We're adding a screen sharing service on a **separate subdomain** (`screenshare.transparentinsurance.net`). This requires **zero changes** to your main website code.

## What You Need to Do

### Step 1: Add DNS Record

Add one DNS record for the subdomain:

```
Type: A (or CNAME)
Name: screenshare
Value: [We'll provide the server IP]
TTL: 3600
```

**That's it!** No other changes needed.

## What We're Doing

- Deploying a Node.js application on the subdomain
- Setting up SSL certificate (Let's Encrypt)
- Configuring the server
- Testing everything

## Important Points

✅ **No code changes** to transparentinsurance.net  
✅ **Separate subdomain** - completely isolated  
✅ **No impact** on main website  
✅ **Independent** deployment and maintenance  

## Timeline

- **DNS Setup:** 15 minutes (your side)
- **DNS Propagation:** 15 min - 2 hours
- **Our Setup:** 1-2 hours (after DNS)
- **Total:** Usually 2-4 hours from start

## What Happens After

Once DNS propagates and we deploy:
- `screenshare.transparentinsurance.net` will serve the screen sharing viewer
- Main site (`transparentinsurance.net`) continues unchanged
- Users can access screen shares via links like: `screenshare.transparentinsurance.net/sess_123`

## Questions?

Just need:
1. DNS record added
2. Server IP or hostname (if using CNAME)

Everything else we handle.

---

**Ready when you are!** Just let us know once the DNS record is added.


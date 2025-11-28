# Quick Deployment Summary

## After DNS Propagation - What You Need to Do

### ✅ Automatic (After Setup)
- DNS resolution
- Viewer page loading
- WebSocket connections
- Screen sharing functionality

### ❌ Manual (You Must Do)

1. **Build Applications**
   ```bash
   ./scripts/build-all.sh
   ```

2. **Deploy to Server**
   - Copy `server/dist` and `viewer/dist` to server
   - Install dependencies: `npm install --production`

3. **Set Up SSL**
   ```bash
   sudo certbot --nginx -d screenshare.transparentinsurance.net
   ```

4. **Configure Nginx**
   - Copy `nginx.conf.example` to `/etc/nginx/sites-available/`
   - Update paths
   - Enable site

5. **Start Server**
   ```bash
   pm2 start dist/index.js --name usha-server
   ```

6. **Configure Extension**
   - Viewer Domain: `https://screenshare.transparentinsurance.net`
   - Save

## Then It Works!

Once all steps are complete, viewer links like:
```
https://screenshare.transparentinsurance.net/screenshareid169304
```

Will work automatically! 🎉

See `PRODUCTION_DEPLOYMENT.md` for detailed instructions.


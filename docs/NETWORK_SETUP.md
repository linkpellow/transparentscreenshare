# Network Setup for Remote Viewers

## Problem

By default, the server runs on `localhost:3000`, which only works on the same computer. Viewers on other devices need the **network IP address** or a **public URL**.

## Solution Options

### Option 1: Use Local Network IP (Recommended for Development)

1. **Find your local IP address:**

   **macOS/Linux:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Or
   ipconfig getifaddr en0
   ```

   **Windows:**
   ```bash
   ipconfig
   # Look for IPv4 Address under your network adapter
   ```

   Example: `192.168.1.100` or `172.16.20.145`

2. **Start server on network interface:**
   ```bash
   # Instead of just: npm run dev
   # Use:
   HOST=0.0.0.0 npm run dev
   # Or set in .env:
   # HOST=0.0.0.0
   # PORT=3000
   ```

3. **Configure extension with network IP:**
   - Open extension popup
   - Enter server URL: `http://192.168.1.100:3000` (use your IP)
   - Click save button 💾
   - Start sharing
   - Copy viewer link (will now use network IP)

4. **Share the link:**
   - Viewers on same network can access: `http://192.168.1.100:3000/view/{sessionId}`
   - Works on any device on your local network

### Option 2: Use ngrok (For Testing Across Internet)

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com
   ```

2. **Start your server:**
   ```bash
   cd server
   npm run dev
   ```

3. **Create tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Get public URL:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Configure extension:**
   - Enter server URL: `https://abc123.ngrok.io`
   - Save and start sharing

6. **Share link:**
   - Viewers anywhere can access: `https://abc123.ngrok.io/view/{sessionId}`
   - Works across the internet!

### Option 3: Deploy to Production Server

1. **Deploy server to cloud:**
   - AWS, Heroku, DigitalOcean, etc.
   - Get public URL: `https://api.usha.app`

2. **Configure extension:**
   - Enter server URL: `https://api.usha.app`
   - Save and use

3. **Share link:**
   - Viewers access: `https://api.usha.app/view/{sessionId}`
   - Works globally!

## Quick Setup Guide

### For Local Network Access

1. **Get your IP:**
   ```bash
   # macOS
   ipconfig getifaddr en0
   
   # Linux
   hostname -I | awk '{print $1}'
   
   # Windows
   ipconfig | findstr IPv4
   ```

2. **Update server to listen on all interfaces:**
   
   Edit `server/src/index.ts`:
   ```typescript
   server.listen(PORT, '0.0.0.0', () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

   Or use environment variable:
   ```bash
   HOST=0.0.0.0 npm run dev
   ```

3. **Configure extension:**
   - Open popup
   - Server URL: `http://YOUR_IP:3000`
   - Click save 💾

4. **Test:**
   - Start sharing
   - Copy viewer link
   - Open on another device on same network
   - Should work!

## Firewall Configuration

### macOS
```bash
# Allow incoming connections on port 3000
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Linux
```bash
# Allow port 3000
sudo ufw allow 3000/tcp
# Or
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### Windows
- Open Windows Defender Firewall
- Allow Node.js through firewall
- Or allow port 3000

## Extension UI

The extension popup now includes:
- **Viewer Link field**: Shows the full viewer URL
- **Server URL field**: Configure the server address
- **Save button**: Save server URL configuration

## Testing

1. **Same device:**
   - Use `http://localhost:3000` ✅

2. **Same network:**
   - Use `http://192.168.1.100:3000` (your local IP) ✅

3. **Different networks:**
   - Use ngrok or production server ✅

## Security Notes

- **Local network**: Only accessible on your WiFi/LAN
- **ngrok**: Public but temporary (free tier)
- **Production**: Use HTTPS, authentication, rate limiting

## Troubleshooting

### "Connection refused"
- Server not running
- Wrong IP address
- Firewall blocking

### "Can't connect"
- Check server is listening on `0.0.0.0` not just `localhost`
- Verify IP address is correct
- Check firewall settings

### "WebSocket connection failed"
- Ensure WebSocket URL uses same protocol (http/ws or https/wss)
- Check server supports WebSockets
- Verify port is open


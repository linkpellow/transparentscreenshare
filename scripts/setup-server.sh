#!/bin/bash
# Server setup script - run on your server

set -e

echo "🛠️  Setting up Usha server..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Install Node.js 18 if not present
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js 18..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2..."
  npm install -g pm2
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
  echo "📦 Installing Nginx..."
  apt-get update
  apt-get install -y nginx
fi

# Install certbot for SSL
if ! command -v certbot &> /dev/null; then
  echo "📦 Installing Certbot..."
  apt-get install -y certbot python3-certbot-nginx
fi

# Create application directory
APP_DIR="/opt/usha"
mkdir -p ${APP_DIR}
echo "✅ Created directory: ${APP_DIR}"

# Create systemd service file
cat > /etc/systemd/system/usha-server.service << EOF
[Unit]
Description=Usha Screen Sharing Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${APP_DIR}/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Created systemd service"
echo ""
echo "Next steps:"
echo "1. Copy application files to ${APP_DIR}"
echo "2. Configure .env file in ${APP_DIR}/server/"
echo "3. Set up SSL: sudo certbot --nginx -d screenshare.transparentinsurance.net"
echo "4. Copy nginx.conf.example to /etc/nginx/sites-available/screenshare"
echo "5. Enable site: sudo ln -s /etc/nginx/sites-available/screenshare /etc/nginx/sites-enabled/"
echo "6. Start server: sudo systemctl start usha-server"
echo "7. Enable on boot: sudo systemctl enable usha-server"


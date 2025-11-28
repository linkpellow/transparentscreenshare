#!/bin/bash
# Helper script to create .env file from template
# Usage: ./scripts/create-env.sh [production|development]

set -e

ENV_TYPE="${1:-production}"
SERVER_DIR="server"

if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ Error: server/ directory not found"
    exit 1
fi

cd "$SERVER_DIR"

TEMPLATE_FILE="env.${ENV_TYPE}.template"
ENV_FILE=".env"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Error: Template file $TEMPLATE_FILE not found"
    echo "Available templates:"
    ls -1 env.*.template 2>/dev/null || echo "  (none found)"
    exit 1
fi

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  Warning: .env file already exists"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    echo "✅ Backed up existing .env to .env.backup"
fi

cp "$TEMPLATE_FILE" "$ENV_FILE"
echo "✅ Created .env from $TEMPLATE_FILE"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env and update:"
echo "      - DATABASE_URL (with your actual database password)"
echo "      - Verify ALLOWED_ORIGINS"
echo "      - Verify APP_URL"
echo ""
echo "   2. For production deployment, copy this .env to your server:"
echo "      scp server/.env linkpellow@transparentinsurance.net:/opt/usha/server/.env"
echo ""


#!/bin/bash

# Setup script for HTTPS certificates using mkcert
# This enables Stripe Elements autofill in development

echo "🔐 Setting up HTTPS for local development..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed."
    echo ""
    echo "Please install mkcert first:"
    echo "  macOS: brew install mkcert"
    echo "  Linux: See https://github.com/FiloSottile/mkcert#linux"
    echo "  Windows: choco install mkcert"
    echo ""
    echo "After installing, run: mkcert -install"
    exit 1
fi

# Create certs directory
mkdir -p certs

# Generate certificates
echo "📜 Generating local SSL certificates..."
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1

echo ""
echo "✅ HTTPS certificates created successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Update package.json to use 'dev:https' script"
echo "  2. Run: npm run dev:https"
echo "  3. Visit: https://localhost:3000"
echo ""
echo "⚠️  Note: You may need to accept the certificate in your browser"
echo "   (this is safe for local development)"


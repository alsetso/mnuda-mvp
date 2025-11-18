# HTTPS Setup for Stripe Elements

## Why HTTPS is Needed

Stripe Elements requires HTTPS for browser autofill features. The warning you see ("Automatic payment methods filling is disabled because this form does not use a secure connection") is expected in development when using HTTP.

**Important:** This warning does NOT affect security. Stripe Elements still securely processes payments over HTTP in development. It only disables browser autofill for convenience.

## Option 1: Accept the Warning (Recommended for Development)

The warning is safe to ignore in development. Stripe Elements will work correctly, and payments will be processed securely. The only limitation is that browser autofill won't work.

## Option 2: Enable HTTPS for Local Development

If you want to enable autofill and remove the warning, follow these steps:

### Step 1: Install mkcert

**macOS:**
```bash
brew install mkcert
mkcert -install
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
# Download from https://github.com/FiloSottile/mkcert/releases
# Or use package manager
```

**Windows:**
```bash
choco install mkcert
# Or download from https://github.com/FiloSottile/mkcert/releases
```

### Step 2: Generate Certificates

```bash
npm run setup:https
```

This will create SSL certificates in the `certs/` directory.

### Step 3: Start Development Server with HTTPS

```bash
npm run dev:https
```

Then visit: **https://localhost:3000**

**Note:** You may need to accept the certificate in your browser (click "Advanced" → "Proceed to localhost"). This is safe for local development.

## Troubleshooting

### Certificate Errors

If you see certificate errors:
1. Make sure `mkcert -install` was run successfully
2. Check that certificates exist in `certs/` directory
3. Try regenerating: `npm run setup:https`

### Port Already in Use

If port 3000 is in use:
1. Stop other Next.js servers
2. Or modify `server.js` to use a different port

### Stripe Still Shows Warning

If the warning persists:
1. Make sure you're accessing `https://localhost:3000` (not `http://`)
2. Clear browser cache
3. Check browser console for HTTPS connection status

## Production

In production, HTTPS is automatically handled by your hosting provider (Vercel, etc.). This setup is only needed for local development.


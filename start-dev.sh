#!/bin/bash
# Kill any existing processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Clear Next.js cache
rm -rf .next

# Start dev server with increased header size limit
# This prevents 431 errors from accumulated headers/cookies
NODE_OPTIONS="--max-http-header-size=32768" npm run dev

#!/bin/bash
# Start server script with better error handling

cd "$(dirname "$0")"

echo "🔄 Starting backend server..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Check for .env file
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found"
fi

# Start server
echo "🚀 Starting server..."
npm run dev


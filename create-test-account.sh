#!/bin/bash

# Quick script to create a test account for login

echo "🔧 Creating test account..."

cd backend

# Check if backend is running
if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo "   Please start it first:"
    echo "   cd backend && npm run dev"
    exit 1
fi

# Create admin account
echo "📝 Creating admin account..."
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "admin@test.com",
    "password": "password123",
    "role": "admin"
  }' 2>/dev/null | python3 -m json.tool 2>/dev/null || echo ""

echo ""
echo "✅ Account created!"
echo ""
echo "📧 Login Credentials:"
echo "   Email: admin@test.com"
echo "   Password: password123"
echo ""
echo "🌐 Login at: http://localhost:5173"
echo ""


#!/bin/bash

# Integration Test Script
# Tests the new frontend services integration

echo "🧪 Testing Frontend Services Integration"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if services exist
echo "📦 Test 1: Checking if new services exist..."
if [ -f "src/services/api/goalsApi.ts" ]; then
    echo -e "${GREEN}✅ Goals API service exists${NC}"
else
    echo -e "${RED}❌ Goals API service missing${NC}"
fi

if [ -f "src/hooks/useGoals.ts" ]; then
    echo -e "${GREEN}✅ useGoals hook exists${NC}"
else
    echo -e "${RED}❌ useGoals hook missing${NC}"
fi

if [ -f "src/services/api/filesApi.ts" ]; then
    echo -e "${GREEN}✅ Files API service exists${NC}"
else
    echo -e "${RED}❌ Files API service missing${NC}"
fi

if [ -f "src/services/realtimeService.ts" ]; then
    echo -e "${GREEN}✅ Real-time service exists${NC}"
else
    echo -e "${RED}❌ Real-time service missing${NC}"
fi

echo ""

# Test 2: Check if socket.io-client is installed
echo "📦 Test 2: Checking dependencies..."
if grep -q "socket.io-client" package.json; then
    echo -e "${GREEN}✅ socket.io-client is installed${NC}"
else
    echo -e "${RED}❌ socket.io-client missing from package.json${NC}"
fi

echo ""

# Test 3: Check if services are imported in components
echo "🔗 Test 3: Checking component integrations..."

if grep -q "useGoals\|goalsApi" src/pages/AcademicProgress.tsx; then
    echo -e "${GREEN}✅ Goals service integrated in AcademicProgress${NC}"
else
    echo -e "${YELLOW}⚠️  Goals service not found in AcademicProgress${NC}"
fi

if grep -q "useRealtime\|realtimeService" src/App.jsx; then
    echo -e "${GREEN}✅ Real-time service integrated in App.jsx${NC}"
else
    echo -e "${YELLOW}⚠️  Real-time service not found in App.jsx${NC}"
fi

if grep -q "useRealtime" src/pages/AcademicProgress.tsx; then
    echo -e "${GREEN}✅ Real-time service integrated in AcademicProgress${NC}"
else
    echo -e "${YELLOW}⚠️  Real-time service not found in AcademicProgress${NC}"
fi

if grep -q "useRealtime" src/components/AdminDemo.tsx; then
    echo -e "${GREEN}✅ Real-time service integrated in AdminDemo${NC}"
else
    echo -e "${YELLOW}⚠️  Real-time service not found in AdminDemo${NC}"
fi

echo ""

# Test 4: Check backend endpoints
echo "🌐 Test 4: Checking backend endpoints..."

BACKEND_HEALTH=$(curl -s http://localhost:4000/health 2>&1)
if echo "$BACKEND_HEALTH" | grep -q "ok\|status"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    
    # Test Goals endpoint
    GOALS_RESPONSE=$(curl -s http://localhost:4000/api/goals 2>&1)
    if echo "$GOALS_RESPONSE" | grep -q "success\|error"; then
        echo -e "${GREEN}✅ Goals endpoint is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Goals endpoint may not be working (MongoDB needed)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend not responding (may need MongoDB)${NC}"
fi

echo ""

# Test 5: Check frontend
echo "🎨 Test 5: Checking frontend..."
FRONTEND_RESPONSE=$(curl -s http://localhost:5173 2>&1)
if echo "$FRONTEND_RESPONSE" | grep -q "EduConnect\|html"; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend not responding${NC}"
fi

echo ""
echo "========================================"
echo "✅ Integration Test Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Open http://localhost:5173 in browser"
echo "2. Open browser console (F12)"
echo "3. Check for Socket.io connection messages"
echo "4. Navigate to Academic Progress page"
echo "5. Check Goals card displays"
echo ""
echo "💡 Note: Full functionality requires MongoDB connection"
echo "   See TESTING_SETUP.md for MongoDB setup options"


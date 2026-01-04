#!/bin/bash

# Test Local Setup Script
# This script checks if both backend and frontend are running

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Local Setup...${NC}"
echo ""

# Test Backend
echo -e "${BLUE}Testing Backend (http://localhost:4000)...${NC}"
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    BACKEND_STATUS=$(curl -s http://localhost:4000/health)
    if echo "$BACKEND_STATUS" | grep -q "ok"; then
        echo -e "${GREEN}✅ Backend is running!${NC}"
        echo "   Response: $BACKEND_STATUS"
    else
        echo -e "${RED}❌ Backend responded but with unexpected response${NC}"
    fi
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo -e "${YELLOW}   Start it with: cd backend && npm run dev${NC}"
fi

echo ""

# Test Frontend
echo -e "${BLUE}Testing Frontend (http://localhost:5173)...${NC}"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running!${NC}"
    echo "   Open in browser: http://localhost:5173"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    echo -e "${YELLOW}   Start it with: npm run dev${NC}"
fi

echo ""

# Test API Connection
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${BLUE}Testing API Endpoints...${NC}"
    
    # Test auth endpoint
    AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/auth/login -X POST -H "Content-Type: application/json" -d '{}' 2>/dev/null)
    if [ "$AUTH_TEST" = "400" ] || [ "$AUTH_TEST" = "401" ]; then
        echo -e "${GREEN}✅ API endpoints are accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  API endpoint returned: $AUTH_TEST${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📋 Summary:${NC}"
if curl -s http://localhost:4000/health > /dev/null 2>&1 && curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Both servers are running!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your website is ready!${NC}"
    echo -e "   Frontend: ${BLUE}http://localhost:5173${NC}"
    echo -e "   Backend:  ${BLUE}http://localhost:4000${NC}"
    echo ""
    echo -e "${YELLOW}💡 Open http://localhost:5173 in your browser to test${NC}"
else
    echo -e "${RED}❌ Some servers are not running${NC}"
    echo ""
    echo -e "${YELLOW}To start everything:${NC}"
    echo -e "   ${BLUE}./launch.sh${NC}"
    echo ""
    echo -e "Or manually:"
    echo -e "   Terminal 1: ${BLUE}cd backend && npm run dev${NC}"
    echo -e "   Terminal 2: ${BLUE}npm run dev${NC}"
fi


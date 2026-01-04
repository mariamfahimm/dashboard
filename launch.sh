#!/bin/bash

# EduConnect Dashboard Launch Script
# This script starts both backend and frontend servers

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Launching EduConnect Dashboard...${NC}"
echo ""

# Check if backend is already running
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend already running on http://localhost:4000${NC}"
else
    echo -e "${BLUE}📦 Starting backend server...${NC}"
    cd backend
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  Error: .env file not found!${NC}"
        echo -e "${YELLOW}⚠️  Please create backend/.env file with your MongoDB connection string${NC}"
        echo -e "${YELLOW}⚠️  Required variables: MONGO_URI, JWT_SECRET, FRONTEND_URL${NC}"
        exit 1
    fi
    
    # Check if MONGO_URI is set
    if ! grep -q "MONGO_URI=" .env 2>/dev/null || grep -q "MONGO_URI=$" .env 2>/dev/null || grep -q "MONGO_URI=your_mongodb" .env 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Error: MONGO_URI not set in .env file!${NC}"
        echo -e "${YELLOW}⚠️  Please set MONGO_URI in backend/.env file${NC}"
        exit 1
    fi
    
    # Start backend in background
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    echo "   Logs: backend.log"
    
    # Wait for backend to be ready
    echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:4000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready!${NC}"
            break
        fi
        sleep 1
    done
    
    cd ..
fi

# Check if frontend .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Creating frontend .env file...${NC}"
    echo "VITE_API_BASE_URL=http://localhost:4000/api" > .env
fi

# Start frontend
echo -e "${BLUE}🎨 Starting frontend server...${NC}"
echo ""
echo -e "${GREEN}✅ Dashboard will be available at: http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}💡 To setup test data, run: ./setup-test-data.sh${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${BLUE}🛑 Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start frontend (this will block)
npm run dev


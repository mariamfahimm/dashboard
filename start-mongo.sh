#!/bin/bash
# Quick script to start MongoDB with Docker

echo "🚀 Starting MongoDB with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo ""
    echo "Please install Docker Desktop from:"
    echo "https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "Or see DOCKER_SETUP.md for detailed instructions."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")"

# Start MongoDB
echo "📦 Starting MongoDB container..."
docker compose up -d

# Wait a moment for MongoDB to start
sleep 3

# Check status
echo ""
echo "📊 MongoDB Status:"
docker compose ps

echo ""
echo "✅ MongoDB should be running!"
echo ""
echo "Next steps:"
echo "  1. Validate connection: cd backend && npm run validate-db"
echo "  2. Seed demo data: cd backend && npm run seed:demo"
echo "  3. Start backend: cd backend && npm run dev"

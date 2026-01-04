#!/bin/bash

# Script to add multiple test children/students to your account
# This will create 3-5 students linked to your logged-in user

set -e

echo "👨‍👩‍👧‍👦 Adding Multiple Children to Your Account..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
if ! curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${RED}❌ Backend server is not running. Please start it first:${NC}"
    echo "   cd backend && npm run dev"
    exit 1
fi

# Get login credentials from arguments or environment variables, or prompt
if [ -n "$1" ] && [ -n "$2" ]; then
    EMAIL="$1"
    PASSWORD="$2"
    echo -e "${BLUE}📝 Using provided credentials for: $EMAIL${NC}"
elif [ -n "$DASHBOARD_EMAIL" ] && [ -n "$DASHBOARD_PASSWORD" ]; then
    EMAIL="$DASHBOARD_EMAIL"
    PASSWORD="$DASHBOARD_PASSWORD"
    echo -e "${BLUE}📝 Using environment variables for: $EMAIL${NC}"
else
    # Try default test account first
    EMAIL="test@educonnect.com"
    PASSWORD="password123"
    echo -e "${BLUE}📝 Trying default test account: $EMAIL${NC}"
    echo -e "${YELLOW}💡 Tip: You can pass credentials as arguments: ./add-multiple-children.sh your@email.com yourpassword${NC}"
fi
echo ""

# Login and get token
echo -e "${BLUE}🔐 Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Extract token and user ID using Python (more reliable than grep)
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)
USER_ID=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('user', {}).get('_id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "None" ]; then
    echo -e "${RED}❌ Login failed. Please check your credentials.${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Logged in successfully!${NC}"
echo -e "${BLUE}👤 User ID: $USER_ID${NC}"
echo ""

# Array of children to create
CHILDREN=(
    "Emma|STU001|8|👧"
    "Lucas|STU002|9|👦"
    "Sophia|STU003|10|👧"
    "Noah|STU004|7|👦"
    "Olivia|STU005|11|👧"
)

echo -e "${BLUE}📝 Creating ${#CHILDREN[@]} children...${NC}"
echo ""

CREATED=0
FAILED=0

for child in "${CHILDREN[@]}"; do
    IFS='|' read -r name studentId gradeLevel emoji <<< "$child"
    
    echo -e "${BLUE}Creating: $emoji $name (Grade $gradeLevel)...${NC}"
    
    RESPONSE=$(curl -s -X POST http://localhost:4000/api/students \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"name\": \"$name\",
        \"studentId\": \"$studentId\",
        \"gradeLevel\": $gradeLevel,
        \"userId\": \"$USER_ID\",
        \"avatar\": \"$emoji\"
      }")
    
    # Check if creation was successful
    if echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); exit(0 if data.get('success') or data.get('_id') else 1)" 2>/dev/null; then
        echo -e "${GREEN}  ✅ Created: $name${NC}"
        CREATED=$((CREATED + 1))
    else
        # Check if student already exists
        if echo "$RESPONSE" | grep -q "already exists"; then
            echo -e "${YELLOW}  ⚠️  $name already exists, skipping...${NC}"
        else
            echo -e "${RED}  ❌ Failed to create $name${NC}"
            echo "  Response: $RESPONSE"
            FAILED=$((FAILED + 1))
        fi
    fi
    echo ""
done

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Summary:${NC}"
echo -e "   Created: $CREATED children"
if [ $FAILED -gt 0 ]; then
    echo -e "   ${RED}Failed: $FAILED${NC}"
fi
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🎉 Done! Now refresh your dashboard and you should see all your children!${NC}"
echo ""


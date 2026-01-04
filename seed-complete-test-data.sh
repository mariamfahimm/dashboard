#!/bin/bash

# Comprehensive Test Data Seeding Script
# This script populates the database with complete test data for all components

set -e

echo "🌱 Seeding Complete Test Data for EduConnect Dashboard..."
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

# Default credentials
EMAIL="${1:-test@educonnect.com}"
PASSWORD="${2:-password123}"

echo -e "${BLUE}📝 Step 1: Authenticating as ${EMAIL}...${NC}"

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Extract token and user ID using Python (more reliable)
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)
USER_ID=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('user', {}).get('_id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "None" ]; then
    echo -e "${YELLOW}⚠️  Login failed. Trying to register...${NC}"
    REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Test Parent\",
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\",
        \"role\": \"parent\"
      }")
    TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)
    USER_ID=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('user', {}).get('_id', ''))" 2>/dev/null)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" == "None" ]; then
    echo -e "${RED}❌ Failed to authenticate${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated! User ID: $USER_ID${NC}"
echo ""

# Get existing students for this user
echo -e "${BLUE}📝 Step 2: Getting existing students...${NC}"
STUDENTS_RESPONSE=$(curl -s http://localhost:4000/api/students \
  -H "Authorization: Bearer $TOKEN")

STUDENT_IDS=$(echo $STUDENTS_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
students = data.get('data', []) if isinstance(data, dict) else data
for s in students:
    print(s.get('_id', ''))
" 2>/dev/null)

if [ -z "$STUDENT_IDS" ]; then
    echo -e "${YELLOW}⚠️  No students found. Creating test students...${NC}"
    
    # Create 3 test students
    for name in "Emma" "Lucas" "Sophia"; do
        GRADE=$((RANDOM % 5 + 7)) # Random grade 7-11
        STUDENT_ID_GEN="STU-${name}-$(date +%s)"
        
        CREATE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/students \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"name\": \"$name\",
            \"studentId\": \"$STUDENT_ID_GEN\",
            \"gradeLevel\": $GRADE,
            \"userId\": \"$USER_ID\"
          }")
        
        NEW_STUDENT_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('_id', ''))" 2>/dev/null)
        if [ -n "$NEW_STUDENT_ID" ]; then
            STUDENT_IDS="$STUDENT_IDS $NEW_STUDENT_ID"
            echo -e "${GREEN}  ✅ Created student: $name${NC}"
        fi
    done
else
    echo -e "${GREEN}✅ Found existing students${NC}"
fi

# Get first student ID for seeding
FIRST_STUDENT_ID=$(echo $STUDENT_IDS | awk '{print $1}')

if [ -z "$FIRST_STUDENT_ID" ]; then
    echo -e "${RED}❌ No student ID available for seeding${NC}"
    exit 1
fi

echo -e "${BLUE}📝 Step 3: Creating courses...${NC}"

# Create courses
COURSES=(
    "Mathematics,Math,101"
    "Science,Sci,102"
    "English,Eng,103"
    "History,Hist,104"
    "Computer Science,CS,105"
)

COURSE_IDS=()
for COURSE_DATA in "${COURSES[@]}"; do
    IFS=',' read -r NAME CODE NUMBER <<< "$COURSE_DATA"
    
    CREATE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/courses \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"name\": \"$NAME\",
        \"code\": \"$CODE\",
        \"subject\": \"$NAME\",
        \"description\": \"$NAME course description\",
        \"gradeLevel\": 8
      }")
    
    COURSE_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('_id', ''))" 2>/dev/null)
    if [ -n "$COURSE_ID" ]; then
        COURSE_IDS+=("$COURSE_ID")
        echo -e "${GREEN}  ✅ Created course: $NAME${NC}"
    fi
done

echo -e "${BLUE}📝 Step 4: Creating enrollments...${NC}"

# Enroll students in courses
for STUDENT_ID in $STUDENT_IDS; do
    for COURSE_ID in "${COURSE_IDS[@]}"; do
        ENROLL_RESPONSE=$(curl -s -X POST http://localhost:4000/api/enrollments \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"studentId\": \"$STUDENT_ID\",
            \"courseId\": \"$COURSE_ID\"
          }")
        
        if echo "$ENROLL_RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}  ✅ Enrolled student in course${NC}"
        fi
    done
done

echo -e "${BLUE}📝 Step 5: Creating assignments...${NC}"

# Create assignments for each course
ASSIGNMENT_TYPES=("homework" "quiz" "project" "exam")
ASSIGNMENT_IDS=()

for COURSE_ID in "${COURSE_IDS[@]}"; do
    for TYPE in "${ASSIGNMENT_TYPES[@]}"; do
        # Random due date in next 30 days
        DAYS_FROM_NOW=$((RANDOM % 30))
        DUE_DATE=$(date -v+${DAYS_FROM_NOW}d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -d "+${DAYS_FROM_NOW} days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || echo "")
        
        CREATE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/assignments \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"title\": \"$TYPE Assignment\",
            \"description\": \"Complete this $TYPE assignment\",
            \"type\": \"$TYPE\",
            \"courseId\": \"$COURSE_ID\",
            \"dueDate\": \"$DUE_DATE\",
            \"maxScore\": 100,
            \"status\": \"active\"
          }")
        
        ASSIGNMENT_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('_id', ''))" 2>/dev/null)
        if [ -n "$ASSIGNMENT_ID" ]; then
            ASSIGNMENT_IDS+=("$ASSIGNMENT_ID")
            echo -e "${GREEN}  ✅ Created assignment: $TYPE${NC}"
        fi
    done
done

echo -e "${BLUE}📝 Step 6: Creating grades...${NC}"

# Create grades for assignments
for STUDENT_ID in $STUDENT_IDS; do
    for ASSIGNMENT_ID in "${ASSIGNMENT_IDS[@]}"; do
        # Random grade between 60-100
        SCORE=$((RANDOM % 41 + 60))
        MAX_SCORE=100
        PERCENTAGE=$((SCORE * 100 / MAX_SCORE))
        
        GRADE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/grades \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"studentId\": \"$STUDENT_ID\",
            \"assignmentId\": \"$ASSIGNMENT_ID\",
            \"score\": $SCORE,
            \"maxScore\": $MAX_SCORE,
            \"percentage\": $PERCENTAGE
          }")
        
        if echo "$GRADE_RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}  ✅ Created grade: $SCORE/$MAX_SCORE${NC}"
        fi
    done
done

echo -e "${BLUE}📝 Step 7: Creating events...${NC}"

# Create calendar events
EVENT_TYPES=("school_event" "exam" "holiday" "meeting" "deadline" "reminder")
for i in {1..10}; do
    TYPE=${EVENT_TYPES[$RANDOM % ${#EVENT_TYPES[@]}]}
    DAYS_FROM_NOW=$((RANDOM % 60))
    START_DATE=$(date -v+${DAYS_FROM_NOW}d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -d "+${DAYS_FROM_NOW} days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || echo "")
    
    EVENT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/events \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"title\": \"$TYPE Event $i\",
        \"description\": \"Description for $TYPE event\",
        \"type\": \"$TYPE\",
        \"startDate\": \"$START_DATE\",
        \"allDay\": true,
        \"studentId\": \"$FIRST_STUDENT_ID\",
        \"priority\": \"normal\"
      }")
    
    if echo "$EVENT_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}  ✅ Created event: $TYPE${NC}"
    fi
done

echo -e "${BLUE}📝 Step 8: Creating messages...${NC}"

# Create messages (need teacher/admin user IDs - using placeholder for now)
for i in {1..5}; do
    MESSAGE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/messages \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"to\": {
          \"userId\": \"teacher1\",
          \"name\": \"Teacher Name\",
          \"role\": \"teacher\"
        },
        \"subject\": \"Message Subject $i\",
        \"content\": \"This is message content $i\",
        \"studentId\": \"$FIRST_STUDENT_ID\",
        \"priority\": \"normal\",
        \"category\": \"general\"
      }")
    
    if echo "$MESSAGE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}  ✅ Created message: $i${NC}"
    fi
done

echo -e "${BLUE}📝 Step 9: Creating notices...${NC}"

# Create notices
for i in {1..5}; do
    NOTICE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/notices \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"title\": \"Notice Title $i\",
        \"content\": \"This is notice content $i\",
        \"type\": \"announcement\",
        \"priority\": \"normal\",
        \"published\": true
      }")
    
    if echo "$NOTICE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}  ✅ Created notice: $i${NC}"
    fi
done

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Test Data Seeding Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "   • Students: Multiple"
echo "   • Courses: ${#COURSES[@]}"
echo "   • Assignments: ${#ASSIGNMENT_IDS[@]}"
echo "   • Grades: Multiple"
echo "   • Events: 10"
echo "   • Messages: 5"
echo "   • Notices: 5"
echo ""
echo -e "${BLUE}🎉 Your dashboard should now have data in all components!${NC}"
echo ""


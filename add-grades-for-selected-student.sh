#!/bin/bash

# Script to add grades for the currently selected student
# This ensures grades are created with the correct studentId (MongoDB _id)

set -e

echo "📝 Adding Grades for Your Students..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check backend
if ! curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${RED}❌ Backend server is not running${NC}"
    exit 1
fi

# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@educonnect.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
USER_ID=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('_id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in${NC}"
echo ""

# Get students for this user
echo -e "${BLUE}📝 Getting your students...${NC}"
STUDENTS_RESPONSE=$(curl -s http://localhost:4000/api/students -H "Authorization: Bearer $TOKEN")

STUDENT_LIST=$(echo $STUDENTS_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
students = data.get('data', []) if isinstance(data, dict) else data
# Filter by userId
user_students = [s for s in students if s.get('userId') == '$USER_ID']
for s in user_students[:5]:  # First 5 students
    print(f\"{s.get('_id', '')}|{s.get('studentId', '')}|{s.get('name', '')}\")
" 2>/dev/null)

if [ -z "$STUDENT_LIST" ]; then
    echo -e "${RED}❌ No students found for your account${NC}"
    exit 1
fi

# Get courses
echo -e "${BLUE}📝 Getting courses...${NC}"
COURSES_RESPONSE=$(curl -s http://localhost:4000/api/courses -H "Authorization: Bearer $TOKEN")
COURSE_LIST=$(echo $COURSES_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
courses = data.get('data', []) if isinstance(data, dict) else data
for c in courses[:5]:  # First 5 courses
    print(f\"{c.get('_id', '')}|{c.get('subject', '')}\")
" 2>/dev/null)

GRADE_COUNT=0

# Process each student
while IFS='|' read -r STUDENT_MONGO_ID STUDENT_ID_FIELD STUDENT_NAME; do
    if [ -z "$STUDENT_MONGO_ID" ]; then continue; fi
    
    echo -e "${BLUE}📝 Processing: $STUDENT_NAME (ID: $STUDENT_MONGO_ID)${NC}"
    
    # Process each course
    while IFS='|' read -r COURSE_ID COURSE_SUBJECT; do
        if [ -z "$COURSE_ID" ]; then continue; fi
        
        # Get or create enrollment
        ENROLLMENT_RESPONSE=$(curl -s "http://localhost:4000/api/enrollments?userId=$USER_ID&courseId=$COURSE_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        ENROLLMENT_ID=$(echo $ENROLLMENT_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
enrollments = data.get('data', []) if isinstance(data, dict) else data
if enrollments:
    print(enrollments[0].get('_id', ''))
" 2>/dev/null)
        
        if [ -z "$ENROLLMENT_ID" ]; then
            # Create enrollment using studentId field
            CREATE_ENROLL=$(curl -s -X POST http://localhost:4000/api/enrollments \
              -H "Content-Type: application/json" \
              -H "Authorization: Bearer $TOKEN" \
              -d "{\"userId\":\"$USER_ID\",\"studentId\":\"$STUDENT_ID_FIELD\",\"courseId\":\"$COURSE_ID\"}")
            
            ENROLLMENT_ID=$(echo $CREATE_ENROLL | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('_id', ''))" 2>/dev/null)
            
            if [ -z "$ENROLLMENT_ID" ]; then
                # Check if already exists error
                ERROR=$(echo $CREATE_ENROLL | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', ''))" 2>/dev/null)
                if echo "$ERROR" | grep -q "already enrolled"; then
                    # Try to get existing enrollment
                    ENROLLMENT_RESPONSE=$(curl -s "http://localhost:4000/api/enrollments?studentId=$STUDENT_MONGO_ID&courseId=$COURSE_ID" \
                      -H "Authorization: Bearer $TOKEN")
                    ENROLLMENT_ID=$(echo $ENROLLMENT_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
enrollments = data.get('data', []) if isinstance(data, dict) else data
if enrollments:
    print(enrollments[0].get('_id', ''))
" 2>/dev/null)
                fi
            fi
        fi
        
        if [ -z "$ENROLLMENT_ID" ]; then
            echo -e "${YELLOW}  ⚠️  No enrollment for $COURSE_SUBJECT${NC}"
            continue
        fi
        
        # Get or create assignment
        ASSIGNMENTS_RESPONSE=$(curl -s "http://localhost:4000/api/assignments?courseId=$COURSE_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        ASSIGNMENT_ID=$(echo $ASSIGNMENTS_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
assignments = data.get('data', []) if isinstance(data, dict) else data
if assignments:
    print(assignments[0].get('_id', ''))
" 2>/dev/null)
        
        if [ -z "$ASSIGNMENT_ID" ]; then
            # Create assignment
            CREATE_ASSIGN=$(curl -s -X POST http://localhost:4000/api/assignments \
              -H "Content-Type: application/json" \
              -H "Authorization: Bearer $TOKEN" \
              -d "{
                \"title\": \"$COURSE_SUBJECT Quiz\",
                \"description\": \"Quiz for $COURSE_SUBJECT\",
                \"type\": \"quiz\",
                \"courseId\": \"$COURSE_ID\",
                \"subject\": \"$COURSE_SUBJECT\",
                \"dueDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\",
                \"maxScore\": 100,
                \"status\": \"completed\"
              }")
            
            ASSIGNMENT_ID=$(echo $CREATE_ASSIGN | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('_id', ''))" 2>/dev/null)
        fi
        
        if [ -z "$ASSIGNMENT_ID" ]; then
            echo -e "${YELLOW}  ⚠️  No assignment for $COURSE_SUBJECT${NC}"
            continue
        fi
        
        # Check if grade exists
        GRADES_RESPONSE=$(curl -s "http://localhost:4000/api/grades?studentId=$STUDENT_MONGO_ID&assignmentId=$ASSIGNMENT_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        EXISTING=$(echo $GRADES_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
grades = data.get('data', []) if isinstance(data, dict) else data
if grades:
    print('exists')
" 2>/dev/null)
        
        if [ "$EXISTING" = "exists" ]; then
            echo -e "${YELLOW}  ℹ️  Grade exists for $COURSE_SUBJECT${NC}"
            continue
        fi
        
        # Create grade using MongoDB _id as studentId
        SCORE=$((RANDOM % 41 + 60))  # 60-100
        PERCENTAGE=$SCORE
        
        GRADE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/grades \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"enrollmentId\": \"$ENROLLMENT_ID\",
            \"assignmentId\": \"$ASSIGNMENT_ID\",
            \"studentId\": \"$STUDENT_MONGO_ID\",
            \"courseId\": \"$COURSE_ID\",
            \"score\": $SCORE,
            \"maxScore\": 100,
            \"percentage\": $PERCENTAGE
          }")
        
        if echo "$GRADE_RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}  ✅ Created grade: $SCORE/100 for $COURSE_SUBJECT${NC}"
            GRADE_COUNT=$((GRADE_COUNT + 1))
        else
            ERROR=$(echo $GRADE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', 'Unknown error'))" 2>/dev/null)
            echo -e "${YELLOW}  ⚠️  Failed: ${ERROR:0:50}${NC}"
        fi
        
    done <<< "$COURSE_LIST"
    
done <<< "$STUDENT_LIST"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Created $GRADE_COUNT new grades${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🎉 Done! Refresh your gradebook to see the grades.${NC}"


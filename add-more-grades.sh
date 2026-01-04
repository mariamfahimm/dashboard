#!/bin/bash

# Script to add more grades for all students
# This ensures each student has multiple grades across different courses

set -e

echo "📝 Adding More Grades for All Students..."
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

# Get all students
echo -e "${BLUE}📝 Getting students...${NC}"
STUDENTS_RESPONSE=$(curl -s http://localhost:4000/api/students -H "Authorization: Bearer $TOKEN")
STUDENT_DATA=$(echo $STUDENTS_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
students = data.get('data', []) if isinstance(data, dict) else data
for s in students:
    print(f\"{s.get('_id', '')}|{s.get('studentId', '')}|{s.get('name', '')}\")
" 2>/dev/null)

# Get all courses
echo -e "${BLUE}📝 Getting courses...${NC}"
COURSES_RESPONSE=$(curl -s http://localhost:4000/api/courses -H "Authorization: Bearer $TOKEN")
COURSE_DATA=$(echo $COURSES_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
courses = data.get('data', []) if isinstance(data, dict) else data
for c in courses:
    print(f\"{c.get('_id', '')}|{c.get('subject', '')}\")
" 2>/dev/null)

GRADE_COUNT=0

# Process each student
while IFS='|' read -r STUDENT_ID STUDENT_ID_FIELD STUDENT_NAME; do
    if [ -z "$STUDENT_ID" ] || [ -z "$STUDENT_ID_FIELD" ]; then continue; fi
    
    echo -e "${BLUE}📝 Processing student: $STUDENT_NAME${NC}"
    
    # Process each course
    while IFS='|' read -r COURSE_ID COURSE_SUBJECT; do
        if [ -z "$COURSE_ID" ]; then continue; fi
        
        # Get or create enrollment
        ENROLLMENT_RESPONSE=$(curl -s "http://localhost:4000/api/enrollments?studentId=$STUDENT_ID&courseId=$COURSE_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        ENROLLMENT_ID=$(echo $ENROLLMENT_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
enrollments = data.get('data', []) if isinstance(data, dict) else data
if enrollments:
    print(enrollments[0].get('_id', ''))
" 2>/dev/null)
        
        if [ -z "$ENROLLMENT_ID" ]; then
            # Create enrollment using studentId field (not _id)
            CREATE_ENROLL=$(curl -s -X POST http://localhost:4000/api/enrollments \
              -H "Content-Type: application/json" \
              -H "Authorization: Bearer $TOKEN" \
              -d "{\"userId\":\"$USER_ID\",\"studentId\":\"$STUDENT_ID_FIELD\",\"courseId\":\"$COURSE_ID\"}")
            
            ENROLLMENT_ID=$(echo $CREATE_ENROLL | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('_id', ''))" 2>/dev/null)
            
            if [ -n "$ENROLLMENT_ID" ]; then
                echo -e "${GREEN}  ✅ Created enrollment for $COURSE_SUBJECT${NC}"
            else
                # Check if enrollment was created but returned error
                ERROR_MSG=$(echo $CREATE_ENROLL | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', ''))" 2>/dev/null)
                if [ -n "$ERROR_MSG" ] && echo "$ERROR_MSG" | grep -q "already enrolled"; then
                    # Enrollment exists, try to get it
                    ENROLLMENT_RESPONSE=$(curl -s "http://localhost:4000/api/enrollments?userId=$USER_ID&courseId=$COURSE_ID" \
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
            echo -e "${YELLOW}  ⚠️  Skipping $COURSE_SUBJECT - no enrollment${NC}"
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
            echo -e "${YELLOW}  ⚠️  Skipping $COURSE_SUBJECT - no assignment${NC}"
            continue
        fi
        
        # Check if grade exists
        GRADES_RESPONSE=$(curl -s "http://localhost:4000/api/grades?studentId=$STUDENT_ID&assignmentId=$ASSIGNMENT_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        EXISTING_GRADE=$(echo $GRADES_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
grades = data.get('data', []) if isinstance(data, dict) else data
if grades:
    print('exists')
" 2>/dev/null)
        
        if [ "$EXISTING_GRADE" = "exists" ]; then
            echo -e "${YELLOW}  ℹ️  Grade already exists for $COURSE_SUBJECT${NC}"
            continue
        fi
        
        # Create grade
        SCORE=$((RANDOM % 41 + 60))  # 60-100
        PERCENTAGE=$SCORE
        
        GRADE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/grades \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"enrollmentId\": \"$ENROLLMENT_ID\",
            \"assignmentId\": \"$ASSIGNMENT_ID\",
            \"studentId\": \"$STUDENT_ID\",
            \"courseId\": \"$COURSE_ID\",
            \"score\": $SCORE,
            \"maxScore\": 100,
            \"percentage\": $PERCENTAGE
          }")
        
        if echo "$GRADE_RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}  ✅ Created grade: $SCORE/100 for $COURSE_SUBJECT${NC}"
            GRADE_COUNT=$((GRADE_COUNT + 1))
        else
            echo -e "${YELLOW}  ⚠️  Failed to create grade for $COURSE_SUBJECT${NC}"
        fi
        
    done <<< "$COURSE_DATA"
    
done <<< "$STUDENT_DATA"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Created $GRADE_COUNT new grades${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🎉 Done! Refresh your gradebook to see the grades.${NC}"


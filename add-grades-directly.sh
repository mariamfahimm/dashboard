#!/bin/bash

# Script to add grades directly to students
# This bypasses the enrollment requirement

set -e

echo "📝 Adding Grades Directly to Students..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if backend is running
if ! curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${RED}❌ Backend server is not running. Please start it first.${NC}"
    exit 1
fi

# Login
echo -e "${BLUE}🔐 Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@educonnect.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
USER_ID=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('_id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "None" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in${NC}"
echo ""

# Get students
echo -e "${BLUE}📝 Getting students...${NC}"
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
    echo -e "${RED}❌ No students found${NC}"
    exit 1
fi

# Get courses
echo -e "${BLUE}📝 Getting courses...${NC}"
COURSES_RESPONSE=$(curl -s http://localhost:4000/api/courses \
  -H "Authorization: Bearer $TOKEN")

COURSE_IDS=$(echo $COURSES_RESPONSE | python3 -c "
import sys, json
data = json.load(sys.stdin)
courses = data.get('data', []) if isinstance(data, dict) else data
for c in courses[:3]:  # Get first 3 courses
    print(c.get('_id', ''))
" 2>/dev/null)

if [ -z "$COURSE_IDS" ]; then
    echo -e "${RED}❌ No courses found${NC}"
    exit 1
fi

# Get or create assignments
echo -e "${BLUE}📝 Getting/Creating assignments...${NC}"
ASSIGNMENT_IDS=()

for COURSE_ID in $COURSE_IDS; do
    # Get assignments for this course
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
        CREATE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/assignments \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"title\": \"Test Assignment\",
            \"description\": \"Test assignment for grading\",
            \"type\": \"homework\",
            \"courseId\": \"$COURSE_ID\",
            \"subject\": \"Math\",
            \"dueDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\",
            \"maxScore\": 100,
            \"status\": \"completed\"
          }")
        
        ASSIGNMENT_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('_id', ''))" 2>/dev/null)
        echo -e "${GREEN}  ✅ Created assignment for course${NC}"
    fi
    
    if [ -n "$ASSIGNMENT_ID" ]; then
        ASSIGNMENT_IDS+=("$ASSIGNMENT_ID")
    fi
done

# Create grades for each student
echo -e "${BLUE}📝 Creating grades...${NC}"
GRADE_COUNT=0

for STUDENT_ID in $STUDENT_IDS; do
    for ASSIGNMENT_ID in "${ASSIGNMENT_IDS[@]}"; do
        # Get course ID from assignment
        ASSIGNMENT_RESPONSE=$(curl -s "http://localhost:4000/api/assignments/$ASSIGNMENT_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        COURSE_ID=$(echo $ASSIGNMENT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('courseId', ''))" 2>/dev/null)
        
        if [ -z "$COURSE_ID" ]; then
            continue
        fi
        
        # Get enrollment or create a dummy one
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
            # Create enrollment
            CREATE_ENROLL_RESPONSE=$(curl -s -X POST http://localhost:4000/api/enrollments \
              -H "Content-Type: application/json" \
              -H "Authorization: Bearer $TOKEN" \
              -d "{
                \"userId\": \"$USER_ID\",
                \"studentId\": \"$STUDENT_ID\",
                \"courseId\": \"$COURSE_ID\",
                \"status\": \"active\"
              }")
            
            ENROLLMENT_ID=$(echo $CREATE_ENROLL_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('_id', ''))" 2>/dev/null)
        fi
        
        if [ -z "$ENROLLMENT_ID" ]; then
            echo -e "${YELLOW}  ⚠️  Skipping grade - no enrollment${NC}"
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
            echo -e "${GREEN}  ✅ Created grade: $SCORE/100 for student${NC}"
            GRADE_COUNT=$((GRADE_COUNT + 1))
        else
            echo -e "${YELLOW}  ⚠️  Grade might already exist${NC}"
        fi
    done
done

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Created $GRADE_COUNT grades${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🎉 Grades added! Refresh your gradebook to see them.${NC}"


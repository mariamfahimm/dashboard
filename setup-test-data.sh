#!/bin/bash

# EduConnect Test Data Setup Script
# This script creates a complete test setup with a user, student, courses, enrollments, assignments, and grades

set -e

echo "🔧 Setting up test data for EduConnect Dashboard..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
if ! curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${YELLOW}⚠️  Backend server is not running. Please start it first:${NC}"
    echo "   cd backend && npm run dev"
    exit 1
fi

echo -e "${BLUE}📝 Step 1: Creating test user...${NC}"

# Create test user
USER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "test@educonnect.com",
    "password": "password123",
    "role": "admin"
  }')

# Extract token and user ID
TOKEN=$(echo $USER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo $USER_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  User might already exist. Trying to login...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@educonnect.com",
        "password": "password123"
      }')
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ User created/logged in. User ID: $USER_ID${NC}"

echo -e "${BLUE}📝 Step 2: Creating test student...${NC}"

# Create student
STUDENT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Test Student\",
    \"studentId\": \"STU$(date +%s)\",
    \"gradeLevel\": 5,
    \"userId\": \"$USER_ID\"
  }")

STUDENT_ID=$(echo $STUDENT_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$STUDENT_ID" ]; then
    echo -e "${YELLOW}⚠️  Student might already exist. Getting existing student...${NC}"
    STUDENTS_RESPONSE=$(curl -s http://localhost:4000/api/students \
      -H "Authorization: Bearer $TOKEN")
    STUDENT_ID=$(echo $STUDENTS_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
fi

echo -e "${GREEN}✅ Student created/found. Student ID: $STUDENT_ID${NC}"

echo -e "${BLUE}📝 Step 3: Creating courses...${NC}"

# Create courses
COURSE1_RESPONSE=$(curl -s -X POST http://localhost:4000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Mathematics",
    "subject": "Math",
    "teacherId": "teacher1"
  }')

COURSE1_ID=$(echo $COURSE1_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

COURSE2_RESPONSE=$(curl -s -X POST http://localhost:4000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Science",
    "subject": "Science",
    "teacherId": "teacher1"
  }')

COURSE2_ID=$(echo $COURSE2_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

COURSE3_RESPONSE=$(curl -s -X POST http://localhost:4000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "English Language",
    "subject": "English",
    "teacherId": "teacher1"
  }')

COURSE3_ID=$(echo $COURSE3_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✅ Courses created:${NC}"
echo "   - Math: $COURSE1_ID"
echo "   - Science: $COURSE2_ID"
echo "   - English: $COURSE3_ID"

echo -e "${BLUE}📝 Step 4: Enrolling student in courses...${NC}"

# Create enrollments
ENROLL1_RESPONSE=$(curl -s -X POST http://localhost:4000/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"studentId\": \"$STUDENT_ID\",
    \"courseId\": \"$COURSE1_ID\",
    \"status\": \"active\"
  }")

ENROLL1_ID=$(echo $ENROLL1_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

ENROLL2_RESPONSE=$(curl -s -X POST http://localhost:4000/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"studentId\": \"$STUDENT_ID\",
    \"courseId\": \"$COURSE2_ID\",
    \"status\": \"active\"
  }")

ENROLL2_ID=$(echo $ENROLL2_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

ENROLL3_RESPONSE=$(curl -s -X POST http://localhost:4000/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"studentId\": \"$STUDENT_ID\",
    \"courseId\": \"$COURSE3_ID\",
    \"status\": \"active\"
  }")

ENROLL3_ID=$(echo $ENROLL3_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✅ Student enrolled in all courses${NC}"

echo -e "${BLUE}📝 Step 5: Creating assignments...${NC}"

# Create assignments
ASSIGN1_RESPONSE=$(curl -s -X POST http://localhost:4000/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"courseId\": \"$COURSE1_ID\",
    \"title\": \"Complete Chapter 3 Exercises\",
    \"subject\": \"Math\",
    \"dueDate\": \"$(date -u -v+7d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -u -d '+7 days' +%Y-%m-%dT23:59:59Z)\",
    \"status\": \"active\"
  }")

ASSIGN1_ID=$(echo $ASSIGN1_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

ASSIGN2_RESPONSE=$(curl -s -X POST http://localhost:4000/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"courseId\": \"$COURSE2_ID\",
    \"title\": \"Science Project Report\",
    \"subject\": \"Science\",
    \"dueDate\": \"$(date -u -v+10d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -u -d '+10 days' +%Y-%m-%dT23:59:59Z)\",
    \"status\": \"active\"
  }")

ASSIGN2_ID=$(echo $ASSIGN2_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

ASSIGN3_RESPONSE=$(curl -s -X POST http://localhost:4000/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"courseId\": \"$COURSE1_ID\",
    \"title\": \"Math Quiz Preparation\",
    \"subject\": \"Math\",
    \"dueDate\": \"$(date -u -v-2d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -u -d '-2 days' +%Y-%m-%dT23:59:59Z)\",
    \"status\": \"completed\"
  }")

ASSIGN3_ID=$(echo $ASSIGN3_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✅ Assignments created${NC}"

echo -e "${BLUE}📝 Step 6: Creating grades...${NC}"

# Create grades
curl -s -X POST http://localhost:4000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"enrollmentId\": \"$ENROLL1_ID\",
    \"assignmentId\": \"$ASSIGN3_ID\",
    \"studentId\": \"$STUDENT_ID\",
    \"courseId\": \"$COURSE1_ID\",
    \"score\": 85,
    \"maxScore\": 100,
    \"submittedAt\": \"$(date -u +%Y-%m-%dT10:00:00Z)\"
  }" > /dev/null

curl -s -X POST http://localhost:4000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"enrollmentId\": \"$ENROLL1_ID\",
    \"assignmentId\": \"$ASSIGN1_ID\",
    \"studentId\": \"$STUDENT_ID\",
    \"courseId\": \"$COURSE1_ID\",
    \"score\": 92,
    \"maxScore\": 100,
    \"submittedAt\": \"$(date -u +%Y-%m-%dT10:00:00Z)\"
  }" > /dev/null

curl -s -X POST http://localhost:4000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"enrollmentId\": \"$ENROLL2_ID\",
    \"assignmentId\": \"$ASSIGN2_ID\",
    \"studentId\": \"$STUDENT_ID\",
    \"courseId\": \"$COURSE2_ID\",
    \"score\": 78,
    \"maxScore\": 100,
    \"submittedAt\": \"$(date -u +%Y-%m-%dT10:00:00Z)\"
  }" > /dev/null

echo -e "${GREEN}✅ Grades created${NC}"

echo ""
echo -e "${GREEN}✅ Test data setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Login Credentials:${NC}"
echo "   Email: test@educonnect.com"
echo "   Password: password123"
echo ""
echo -e "${BLUE}🌐 Next Steps:${NC}"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Login with the credentials above"
echo "   3. You should see the dashboard with test data"
echo ""
echo -e "${YELLOW}💡 To create a student with NO data (for testing empty states):${NC}"
echo "   Run this script again, or create a new student without enrollments"
echo ""


#!/bin/bash

# Quick script to add enrollments and grades for existing student

TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@educonnect.com","password":"password123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

STUDENT_ID="6919b6a86c9c1cfce9760332"

echo "🔧 Adding data for student $STUDENT_ID..."

# Get courses
COURSES=$(curl -s http://localhost:4000/api/courses -H "Authorization: Bearer $TOKEN")
COURSE1_ID=$(echo "$COURSES" | python3 -c "import sys, json; data=json.load(sys.stdin); courses=data.get('data', []); print(courses[0].get('_id') if courses else '')" 2>/dev/null)
COURSE2_ID=$(echo "$COURSES" | python3 -c "import sys, json; data=json.load(sys.stdin); courses=data.get('data', []); print(courses[1].get('_id') if len(courses) > 1 else '')" 2>/dev/null)

if [ -z "$COURSE1_ID" ]; then
  echo "Creating courses..."
  COURSE1=$(curl -s -X POST http://localhost:4000/api/courses \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"title":"Mathematics","subject":"Math","teacherId":"teacher1"}')
  COURSE1_ID=$(echo "$COURSE1" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('_id', ''))" 2>/dev/null)
  
  COURSE2=$(curl -s -X POST http://localhost:4000/api/courses \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"title":"Science","subject":"Science","teacherId":"teacher1"}')
  COURSE2_ID=$(echo "$COURSE2" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('_id', ''))" 2>/dev/null)
fi

echo "Creating enrollments..."
ENROLL1=$(curl -s -X POST http://localhost:4000/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"studentId\":\"$STUDENT_ID\",\"courseId\":\"$COURSE1_ID\",\"status\":\"active\"}")
ENROLL1_ID=$(echo "$ENROLL1" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('_id', ''))" 2>/dev/null)

ENROLL2=$(curl -s -X POST http://localhost:4000/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"studentId\":\"$STUDENT_ID\",\"courseId\":\"$COURSE2_ID\",\"status\":\"active\"}")
ENROLL2_ID=$(echo "$ENROLL2" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('_id', ''))" 2>/dev/null)

echo "Creating grades..."
curl -s -X POST http://localhost:4000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"enrollmentId\":\"$ENROLL1_ID\",\"studentId\":\"$STUDENT_ID\",\"courseId\":\"$COURSE1_ID\",\"score\":85,\"maxScore\":100}" > /dev/null

curl -s -X POST http://localhost:4000/api/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"enrollmentId\":\"$ENROLL2_ID\",\"studentId\":\"$STUDENT_ID\",\"courseId\":\"$COURSE2_ID\",\"score\":92,\"maxScore\":100}" > /dev/null

echo "✅ Data added! Refresh your browser to see it."


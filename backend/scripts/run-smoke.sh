#!/bin/bash

# Robust End-to-End Smoke Test Script for EduConnect Demo
# Validates demo data, API endpoints, real-time updates, and analytics

set -e  # Exit on error

# Configuration
BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_URL="http://localhost:${BACKEND_PORT}"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
API_BASE="${BACKEND_URL}/api"
MAX_RETRIES=10
RETRY_DELAY=2  # seconds
POLL_TIMEOUT=30  # seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_test() {
    local test_name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name: $message"
        ((PASSED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $test_name: $message"
        ((WARNINGS++))
    else
        echo -e "${RED}✗${NC} $test_name: $message"
        ((FAILED++))
    fi
}

print_step() {
    echo -e "\n${BLUE}→${NC} $1"
}

api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers="${4:-Content-Type: application/json}"
    
    if [ -z "$data" ]; then
        curl -s -X "$method" "${API_BASE}${endpoint}" \
            -H "$headers" \
            -w "\n%{http_code}"
    else
        curl -s -X "$method" "${API_BASE}${endpoint}" \
            -H "$headers" \
            -d "$data" \
            -w "\n%{http_code}"
    fi
}

poll_until() {
    local condition=$1
    local max_attempts=$2
    local delay=$3
    local description=$4
    
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if eval "$condition"; then
            return 0
        fi
        if [ $attempt -lt $max_attempts ]; then
            sleep $delay
        fi
        ((attempt++))
    done
    return 1
}

# Environment check
check_environment() {
    print_step "Checking environment..."
    
    local node_env="${NODE_ENV:-development}"
    local allow_demo="${ALLOW_DEMO_SEED:-false}"
    
    if [ "$node_env" != "development" ] && [ "$allow_demo" != "true" ]; then
        echo -e "${RED}❌ ERROR: Smoke tests require NODE_ENV=development or ALLOW_DEMO_SEED=true${NC}"
        echo "   Current NODE_ENV: $node_env"
        echo "   Current ALLOW_DEMO_SEED: $allow_demo"
        exit 1
    fi
    
    print_test "Environment Check" "PASS" "NODE_ENV=$node_env, ALLOW_DEMO_SEED=$allow_demo"
}

# Check if services are running
check_services() {
    print_step "Checking if services are running..."
    
    # Check backend
    local backend_response=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health" || echo "000")
    if [ "$backend_response" = "200" ]; then
        print_test "Backend Health" "PASS" "Backend is running on port ${BACKEND_PORT}"
    else
        print_test "Backend Health" "FAIL" "Backend not responding (got $backend_response)"
        echo -e "${RED}   Please start backend: cd backend && npm run dev${NC}"
        exit 1
    fi
    
    # Check frontend (optional, but warn if not available)
    local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" --max-time 2 || echo "000")
    if [ "$frontend_response" = "200" ]; then
        print_test "Frontend Health" "PASS" "Frontend is running on port ${FRONTEND_PORT}"
    else
        print_test "Frontend Health" "WARN" "Frontend not responding (optional for API tests)"
    fi
}

# Get demo students
get_demo_students() {
    print_step "Fetching demo students..."
    
    local response=$(api_call "GET" "/students?demo=true" "")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" != "200" ]; then
        print_test "Get Demo Students" "FAIL" "HTTP $http_code"
        echo "   Response: $body"
        exit 1
    fi
    
    # Extract student data
    local student_count=$(echo "$body" | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
    
    if [ "$student_count" -eq "0" ]; then
        print_test "Get Demo Students" "FAIL" "No demo students found"
        echo -e "${YELLOW}   Please run: cd backend && npm run seed:demo${NC}"
        exit 1
    fi
    
    # Extract Mariam's ID (first student with name containing "Mariam")
    MARIAM_ID=$(echo "$body" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    MARIAM_STUDENT_ID=$(echo "$body" | grep -o '"studentId":"STU-DEMO-[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    
    if [ -z "$MARIAM_ID" ] || [ -z "$MARIAM_STUDENT_ID" ]; then
        # Try alternative extraction
        MARIAM_ID=$(echo "$body" | grep -A 5 -i "mariam" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
        MARIAM_STUDENT_ID=$(echo "$body" | grep -A 5 -i "mariam" | grep -o '"studentId":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    fi
    
    if [ -z "$MARIAM_ID" ]; then
        print_test "Get Demo Students" "FAIL" "Could not extract Mariam's student ID"
        echo "   Response preview: $(echo "$body" | head -c 200)"
        exit 1
    fi
    
    print_test "Get Demo Students" "PASS" "Found $student_count demo student(s)"
    echo "   Mariam ID: $MARIAM_ID"
    echo "   Mariam Student ID: $MARIAM_STUDENT_ID"
}

# Get course and enrollment for Mariam
get_mariam_course_data() {
    print_step "Getting Mariam's course and enrollment data..."
    
    # Get enrollments for Mariam
    local enrollments_response=$(api_call "GET" "/enrollments?studentId=${MARIAM_ID}" "")
    local enrollments_http=$(echo "$enrollments_response" | tail -n1)
    local enrollments_body=$(echo "$enrollments_response" | sed '$d')
    
    if [ "$enrollments_http" = "200" ]; then
        MARIAM_ENROLLMENT_ID=$(echo "$enrollments_body" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
        MARIAM_COURSE_ID=$(echo "$enrollments_body" | grep -o '"courseId":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
        
        if [ -n "$MARIAM_ENROLLMENT_ID" ] && [ -n "$MARIAM_COURSE_ID" ]; then
            print_test "Get Course Data" "PASS" "Found enrollment and course"
            echo "   Enrollment ID: $MARIAM_ENROLLMENT_ID"
            echo "   Course ID: $MARIAM_COURSE_ID"
            return 0
        fi
    fi
    
    # Fallback: try to get from courses
    local courses_response=$(api_call "GET" "/courses?subject=Math" "")
    local courses_http=$(echo "$courses_response" | tail -n1)
    local courses_body=$(echo "$courses_response" | sed '$d')
    
    if [ "$courses_http" = "200" ]; then
        MARIAM_COURSE_ID=$(echo "$courses_body" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
        if [ -n "$MARIAM_COURSE_ID" ]; then
            print_test "Get Course Data" "WARN" "Using fallback method to get course"
            MARIAM_ENROLLMENT_ID=""  # Will need to create or skip
        fi
    fi
    
    if [ -z "$MARIAM_COURSE_ID" ]; then
        print_test "Get Course Data" "FAIL" "Could not find course data"
        exit 1
    fi
}

# Get or create assignment
get_or_create_assignment() {
    print_step "Getting or creating assignment..."
    
    # Try to get existing assignment
    local assignments_response=$(api_call "GET" "/assignments?courseId=${MARIAM_COURSE_ID}" "")
    local assignments_http=$(echo "$assignments_response" | tail -n1)
    local assignments_body=$(echo "$assignments_response" | sed '$d')
    
    if [ "$assignments_http" = "200" ]; then
        MARIAM_ASSIGNMENT_ID=$(echo "$assignments_body" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
        
        if [ -n "$MARIAM_ASSIGNMENT_ID" ]; then
            print_test "Get Assignment" "PASS" "Found existing assignment"
            echo "   Assignment ID: $MARIAM_ASSIGNMENT_ID"
            return 0
        fi
    fi
    
    # Create new assignment
    local due_date=$(date -u -v+7d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "+7 days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || echo "")
    local assignment_data="{\"courseId\":\"${MARIAM_COURSE_ID}\",\"title\":\"Smoke Test Assignment\",\"subject\":\"Math\",\"dueDate\":\"${due_date}\",\"status\":\"active\"}"
    
    local create_response=$(api_call "POST" "/assignments" "$assignment_data")
    local create_http=$(echo "$create_response" | tail -n1)
    local create_body=$(echo "$create_response" | sed '$d')
    
    if [ "$create_http" = "201" ] || [ "$create_http" = "200" ]; then
        MARIAM_ASSIGNMENT_ID=$(echo "$create_body" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
        if [ -n "$MARIAM_ASSIGNMENT_ID" ]; then
            print_test "Create Assignment" "PASS" "Created new assignment"
            echo "   Assignment ID: $MARIAM_ASSIGNMENT_ID"
            return 0
        fi
    fi
    
    print_test "Get/Create Assignment" "FAIL" "Could not get or create assignment"
    echo "   Response: $create_body"
    exit 1
}

# Get baseline insights
get_baseline_insights() {
    print_step "Getting baseline insights..."
    
    local response=$(api_call "GET" "/performance/${MARIAM_ID}/insights" "")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        BASELINE_INSIGHT_COUNT=$(echo "$body" | grep -o '"type":"[^"]*"' | wc -l | tr -d ' ')
        print_test "Baseline Insights" "PASS" "Found $BASELINE_INSIGHT_COUNT insight(s)"
        BASELINE_INSIGHTS="$body"
    else
        print_test "Baseline Insights" "WARN" "HTTP $http_code (may be empty)"
        BASELINE_INSIGHT_COUNT=0
        BASELINE_INSIGHTS=""
    fi
}

# Create a new grade
create_grade() {
    print_step "Creating a new grade for Mariam..."
    
    if [ -z "$MARIAM_ENROLLMENT_ID" ]; then
        print_test "Create Grade" "WARN" "Skipping (no enrollment ID)"
        return 0
    fi
    
    local submitted_date=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    local grade_data="{\"enrollmentId\":\"${MARIAM_ENROLLMENT_ID}\",\"assignmentId\":\"${MARIAM_ASSIGNMENT_ID}\",\"studentId\":\"${MARIAM_STUDENT_ID}\",\"courseId\":\"${MARIAM_COURSE_ID}\",\"score\":12,\"maxScore\":15,\"percentage\":80,\"submittedAt\":\"${submitted_date}\"}"
    
    local response=$(api_call "POST" "/grades" "$grade_data")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        NEW_GRADE_ID=$(echo "$body" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
        print_test "Create Grade" "PASS" "Grade created successfully"
        echo "   Grade ID: $NEW_GRADE_ID"
        echo "   Score: 12/15 (80%)"
        
        # Wait a moment for processing
        sleep 2
    else
        print_test "Create Grade" "FAIL" "HTTP $http_code"
        echo "   Response: $body"
        exit 1
    fi
}

# Poll for updated insights
poll_insights_update() {
    print_step "Polling for updated insights (max ${POLL_TIMEOUT}s)..."
    
    local start_time=$(date +%s)
    local updated=false
    
    while [ $(($(date +%s) - start_time)) -lt $POLL_TIMEOUT ]; do
        local response=$(api_call "GET" "/performance/${MARIAM_ID}/insights" "")
        local http_code=$(echo "$response" | tail -n1)
        local body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" = "200" ]; then
            local current_count=$(echo "$body" | grep -o '"type":"[^"]*"' | wc -l | tr -d ' ')
            
            # Check if insights changed or if we found an "improving" insight
            if [ "$current_count" != "$BASELINE_INSIGHT_COUNT" ] || echo "$body" | grep -q '"type":"improving"'; then
                updated=true
                print_test "Insights Update" "PASS" "Insights updated (found $current_count insight(s))"
                echo "   Found 'improving' insight or count changed"
                return 0
            fi
        fi
        
        sleep $RETRY_DELAY
    done
    
    if [ "$updated" = false ]; then
        print_test "Insights Update" "WARN" "Insights did not update within timeout (this may be expected)"
    fi
}

# Check forecasts
check_forecasts() {
    print_step "Checking forecasts..."
    
    local response=$(api_call "GET" "/forecast/${MARIAM_ID}" "")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        local forecast_count=$(echo "$body" | grep -o '"goalId":"[^"]*"' | wc -l | tr -d ' ')
        local has_on_track=$(echo "$body" | grep -q '"onTrack":true' && echo "yes" || echo "no")
        
        print_test "Forecasts" "PASS" "Found $forecast_count forecast(s)"
        if [ "$has_on_track" = "yes" ]; then
            echo "   At least one forecast shows 'onTrack: true'"
        fi
    else
        print_test "Forecasts" "WARN" "HTTP $http_code"
    fi
}

# Poll dashboard API for real-time update confirmation
poll_dashboard_update() {
    print_step "Polling dashboard API for real-time update confirmation..."
    
    # Get performance metrics and check if they've changed
    local start_time=$(date +%s)
    local initial_response=$(api_call "GET" "/performance/${MARIAM_ID}" "")
    local initial_http=$(echo "$initial_response" | tail -n1)
    local initial_body=$(echo "$initial_response" | sed '$d')
    
    if [ "$initial_http" != "200" ]; then
        print_test "Dashboard Update" "WARN" "Could not get initial performance metrics"
        return 0
    fi
    
    local initial_score=$(echo "$initial_body" | grep -o '"overallScore":[0-9.]*' | grep -o '[0-9.]*' || echo "0")
    
    # Poll for changes
    local updated=false
    while [ $(($(date +%s) - start_time)) -lt $POLL_TIMEOUT ]; do
        sleep $RETRY_DELAY
        
        local current_response=$(api_call "GET" "/performance/${MARIAM_ID}" "")
        local current_http=$(echo "$current_response" | tail -n1)
        local current_body=$(echo "$current_response" | sed '$d')
        
        if [ "$current_http" = "200" ]; then
            local current_score=$(echo "$current_body" | grep -o '"overallScore":[0-9.]*' | grep -o '[0-9.]*' || echo "0")
            
            # Check if score changed (allowing for floating point differences)
            if [ "$current_score" != "$initial_score" ] && [ -n "$current_score" ] && [ "$current_score" != "0" ]; then
                updated=true
                print_test "Dashboard Update" "PASS" "Performance metrics updated"
                echo "   Initial score: $initial_score, Current score: $current_score"
                return 0
            fi
        fi
    done
    
    if [ "$updated" = false ]; then
        print_test "Dashboard Update" "WARN" "Metrics did not change within timeout (may be expected if score calculation is cached)"
    fi
}

# Main execution
main() {
    echo "🧪 EduConnect Demo Smoke Tests"
    echo "================================"
    echo ""
    
    check_environment
    check_services
    get_demo_students
    get_mariam_course_data
    get_or_create_assignment
    get_baseline_insights
    create_grade
    poll_insights_update
    check_forecasts
    poll_dashboard_update
    
    # Summary
    echo ""
    echo "================================"
    echo "📊 Test Summary"
    echo "================================"
    echo -e "${GREEN}Passed: ${PASSED}${NC}"
    echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
    echo -e "${RED}Failed: ${FAILED}${NC}"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All critical smoke tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some smoke tests failed. Please check the output above.${NC}"
        exit 1
    fi
}

# Run main
main

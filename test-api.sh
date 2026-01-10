#!/bin/bash

# Automated Test Runner for AI Compliance Document Analyzer
# This script runs basic automated tests to verify the backend is working

echo "🧪 Running Automated Tests for AI Compliance Document Analyzer"
echo "=============================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected=$5
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
          -H "Content-Type: application/json" \
          -d "$data" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Expected $expected, got $http_code)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Check if backend is running
echo "Checking if backend is running on port 8000..."
if ! curl -s http://localhost:8000/api/documents > /dev/null; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo ""
    echo "Please start the backend first:"
    echo "  npm run dev:backend"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Test Suite 1: Authentication
echo -e "${BLUE}=== Test Suite 1: Authentication ===${NC}"

test_endpoint \
  "Valid Login" \
  "POST" \
  "http://localhost:8000/api/auth/login" \
  '{"username":"admin","password":"admin123"}' \
  "200"

test_endpoint \
  "Invalid Login" \
  "POST" \
  "http://localhost:8000/api/auth/login" \
  '{"username":"wrong","password":"wrong"}' \
  "401"

test_endpoint \
  "Missing Password" \
  "POST" \
  "http://localhost:8000/api/auth/login" \
  '{"username":"admin"}' \
  "400"

echo ""

# Test Suite 2: Document Management
echo -e "${BLUE}=== Test Suite 2: Document Management ===${NC}"

test_endpoint \
  "Get All Documents" \
  "GET" \
  "http://localhost:8000/api/documents" \
  "" \
  "200"

test_endpoint \
  "Get Non-Existent Document" \
  "GET" \
  "http://localhost:8000/api/documents/fake-id-123" \
  "" \
  "404"

echo ""

# Test Suite 3: Q&A System
echo -e "${BLUE}=== Test Suite 3: Q&A System ===${NC}"

test_endpoint \
  "Ask Question (no docId)" \
  "POST" \
  "http://localhost:8000/api/qa/ask" \
  '{"question":"What are the safety requirements?"}' \
  "200"

test_endpoint \
  "Ask Question Without Question" \
  "POST" \
  "http://localhost:8000/api/qa/ask" \
  '{}' \
  "400"

echo ""

# Test Suite 4: Document Comparison
echo -e "${BLUE}=== Test Suite 4: Document Comparison ===${NC}"

test_endpoint \
  "Compare Non-Existent Documents" \
  "POST" \
  "http://localhost:8000/api/compare" \
  '{"docIdA":"fake-1","docIdB":"fake-2"}' \
  "404"

echo ""

# Summary
echo "=============================================================="
echo -e "${BLUE}Test Summary${NC}"
echo "=============================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi

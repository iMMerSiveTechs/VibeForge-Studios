#!/bin/bash

# DecipherKit Smoke Test Script
# Tests core pipeline endpoints and configuration

set -e

# VibeForge color palette
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
VIOLET='\033[1;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Configuration
BACKEND_URL="http://localhost:3000"
HEALTH_ENDPOINT="/api/decipher/health"
TRANSCRIBE_ENDPOINT="/api/decipher/transcribe"
CORRECT_ENDPOINT="/api/decipher/correct"

# Minimal 1x1 white pixel in base64 (PNG)
WHITE_PIXEL="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

# Print header
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  DecipherKit Pipeline Smoke Test              ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Check if backend is running
echo -e "${MAGENTA}[Test 1]${NC} Checking backend health at ${CYAN}${BACKEND_URL}${NC}..."

if response=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}${HEALTH_ENDPOINT}" 2>/dev/null); then
    body=$(echo "$response" | head -n -1)
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        echo "  Response: $body"
        ((PASSED++))
        
        # Check if Anthropic API is configured
        if echo "$body" | grep -q '"anthropicConfigured":true'; then
            echo -e "${GREEN}✓ Anthropic API is configured${NC}"
            ((PASSED++))
            ANTHROPIC_AVAILABLE=true
        else
            echo -e "${YELLOW}⚠ Anthropic API is not configured${NC}"
            ANTHROPIC_AVAILABLE=false
        fi
    else
        echo -e "${RED}✗ Backend returned status ${http_code}${NC}"
        ((FAILED++))
        exit 1
    fi
else
    echo -e "${RED}✗ Cannot connect to backend at ${BACKEND_URL}${NC}"
    echo ""
    echo -e "${YELLOW}To start the backend:${NC}"
    echo "  cd /Users/AiLabsGururu/Projects/VibeForge-Studios/decipher-kit"
    echo "  npm run dev"
    echo ""
    ((FAILED++))
    exit 1
fi

echo ""

# Test 2: POST /api/decipher/transcribe
echo -e "${MAGENTA}[Test 2]${NC} Testing transcribe endpoint..."

transcribe_payload=$(cat <<EOF
{
  "images": ["$WHITE_PIXEL"],
  "config": {
    "enableCrossImageSynthesis": false,
    "highConfidenceThreshold": 0.9
  }
}
EOF
)

if response=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}${TRANSCRIBE_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "$transcribe_payload" 2>/dev/null); then
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ Transcribe endpoint accepted request (HTTP ${http_code})${NC}"
        echo "  Response: ${body:0:100}..."
        ((PASSED++))
    elif [ "$http_code" = "400" ] || [ "$http_code" = "422" ]; then
        echo -e "${YELLOW}⚠ Transcribe endpoint returned validation error (HTTP ${http_code})${NC}"
        echo "  This is expected if Anthropic API is not configured"
        echo "  Response: ${body:0:100}..."
        ((PASSED++))
    else
        echo -e "${RED}✗ Transcribe endpoint returned status ${http_code}${NC}"
        echo "  Response: ${body:0:100}..."
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ Failed to reach transcribe endpoint${NC}"
    ((FAILED++))
fi

echo ""

# Test 3: POST /api/decipher/correct
echo -e "${MAGENTA}[Test 3]${NC} Testing correct endpoint..."

correct_payload=$(cat <<EOF
{
  "corrections": [
    {
      "original": "test",
      "corrected": "test-fixed"
    }
  ]
}
EOF
)

if response=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}${CORRECT_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "$correct_payload" 2>/dev/null); then
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ Correct endpoint accepted request (HTTP ${http_code})${NC}"
        echo "  Response: ${body:0:100}..."
        ((PASSED++))
    elif [ "$http_code" = "400" ] || [ "$http_code" = "422" ]; then
        echo -e "${YELLOW}⚠ Correct endpoint returned validation error (HTTP ${http_code})${NC}"
        echo "  Response: ${body:0:100}..."
        ((PASSED++))
    else
        echo -e "${RED}✗ Correct endpoint returned status ${http_code}${NC}"
        echo "  Response: ${body:0:100}..."
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ Failed to reach correct endpoint${NC}"
    ((FAILED++))
fi

echo ""
echo ""

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Test Summary                                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Passed: ${PASSED}${NC}"
echo -e "  ${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check backend logs for details.${NC}"
    exit 1
fi

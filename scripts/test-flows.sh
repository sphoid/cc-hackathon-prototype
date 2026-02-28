#!/usr/bin/env bash
# Test flows for the Dynamic UI Workflow Engine
# Usage: ./scripts/test-flows.sh [base_url]

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }

check() {
  local desc="$1" status="$2" expected="$3" body="$4"
  if [ "$status" -eq "$expected" ]; then
    green "  PASS: $desc (HTTP $status)"
    ((PASS++))
  else
    red "  FAIL: $desc (expected $expected, got $status)"
    echo "  Response: $body" | head -3
    ((FAIL++))
  fi
}

echo "========================================="
echo "Dynamic UI Workflow Engine - Test Flows"
echo "Base URL: $BASE_URL"
echo "========================================="
echo ""

# --- Flow 1: List Workflows ---
echo "--- Flow 1: List Workflows ---"
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/engine/workflows")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /api/engine/workflows" "$STATUS" 200 "$BODY"

WORKFLOW_COUNT=$(echo "$BODY" | grep -o '"workflow_id"' | wc -l)
if [ "$WORKFLOW_COUNT" -ge 3 ]; then
  green "  PASS: Contains $WORKFLOW_COUNT workflows"
  ((PASS++))
else
  red "  FAIL: Expected >= 3 workflows, got $WORKFLOW_COUNT"
  ((FAIL++))
fi

echo ""

# --- Flow 2: Multi-turn E-Commerce ---
echo "--- Flow 2: Multi-Turn E-Commerce Flow ---"
SESSION="sess_test_$(date +%s)"

# Turn 1
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/engine/generate" \
  -H "Content-Type: application/json" \
  -d "{\"workflow_id\":\"ecommerce-v1\",\"session_id\":\"$SESSION\",\"query\":\"I'm looking for jackets\"}")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Turn 1: Looking for jackets" "$STATUS" 200 "$BODY"

TURN=$(echo "$BODY" | grep -o '"conversation_turn":[0-9]*' | grep -o '[0-9]*')
if [ "$TURN" = "1" ]; then
  green "  PASS: conversation_turn = 1"
  ((PASS++))
else
  red "  FAIL: Expected conversation_turn 1, got $TURN"
  ((FAIL++))
fi

# Turn 2
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/engine/generate" \
  -H "Content-Type: application/json" \
  -d "{\"workflow_id\":\"ecommerce-v1\",\"session_id\":\"$SESSION\",\"query\":\"Only under \$100\"}")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Turn 2: Only under \$100" "$STATUS" 200 "$BODY"

TURN=$(echo "$BODY" | grep -o '"conversation_turn":[0-9]*' | grep -o '[0-9]*')
if [ "$TURN" = "2" ]; then
  green "  PASS: conversation_turn = 2"
  ((PASS++))
else
  red "  FAIL: Expected conversation_turn 2, got $TURN"
  ((FAIL++))
fi

# Turn 3
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/engine/generate" \
  -H "Content-Type: application/json" \
  -d "{\"workflow_id\":\"ecommerce-v1\",\"session_id\":\"$SESSION\",\"query\":\"Compare the top 3 side by side\"}")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Turn 3: Compare top 3" "$STATUS" 200 "$BODY"

TURN=$(echo "$BODY" | grep -o '"conversation_turn":[0-9]*' | grep -o '[0-9]*')
if [ "$TURN" = "3" ]; then
  green "  PASS: conversation_turn = 3"
  ((PASS++))
else
  red "  FAIL: Expected conversation_turn 3, got $TURN"
  ((FAIL++))
fi

echo ""

# --- Flow 3: Session Retrieval ---
echo "--- Flow 3: Session Retrieval & Deletion ---"
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/engine/session/$SESSION")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET session" "$STATUS" 200 "$BODY"

MSG_COUNT=$(echo "$BODY" | grep -o '"role"' | wc -l)
if [ "$MSG_COUNT" -ge 6 ]; then
  green "  PASS: Session has $MSG_COUNT messages (3 turns)"
  ((PASS++))
else
  red "  FAIL: Expected >= 6 messages, got $MSG_COUNT"
  ((FAIL++))
fi

# Delete session
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/engine/session/$SESSION")
STATUS=$(echo "$RESP" | tail -1)
check "DELETE session" "$STATUS" 200

# Verify deleted
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/engine/session/$SESSION")
STATUS=$(echo "$RESP" | tail -1)
check "GET deleted session returns 404" "$STATUS" 404

echo ""

# --- Flow 4: Cross-Domain Test ---
echo "--- Flow 4: Project Management Query ---"
PM_SESSION="sess_pm_test_$(date +%s)"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/engine/generate" \
  -H "Content-Type: application/json" \
  -d "{\"workflow_id\":\"project-mgmt-v1\",\"session_id\":\"$PM_SESSION\",\"query\":\"Show me all open tasks\"}")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Project mgmt: open tasks" "$STATUS" 200 "$BODY"

echo ""

# --- Flow 5: Error Cases ---
echo "--- Flow 5: Error Cases ---"

# Missing fields
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/engine/generate" \
  -H "Content-Type: application/json" \
  -d '{"workflow_id":"ecommerce-v1"}')
STATUS=$(echo "$RESP" | tail -1)
check "Missing fields returns 400" "$STATUS" 400

# Unknown workflow
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/engine/generate" \
  -H "Content-Type: application/json" \
  -d '{"workflow_id":"nonexistent","session_id":"s1","query":"test"}')
STATUS=$(echo "$RESP" | tail -1)
check "Unknown workflow returns 404" "$STATUS" 404

# Empty query
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/engine/generate" \
  -H "Content-Type: application/json" \
  -d '{"workflow_id":"ecommerce-v1","session_id":"s1","query":""}')
STATUS=$(echo "$RESP" | tail -1)
check "Empty query returns 400" "$STATUS" 400

# Session not found
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/engine/session/sess_nonexistent")
STATUS=$(echo "$RESP" | tail -1)
check "Unknown session returns 404" "$STATUS" 404

echo ""
echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
echo "========================================="

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

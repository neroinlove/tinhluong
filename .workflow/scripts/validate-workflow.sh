#!/usr/bin/env sh
# validate-workflow.sh — kiểm tra workflow contract hợp lệ
# Usage: sh .workflow/scripts/validate-workflow.sh

set -e

PASS=0
FAIL=0
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); }

echo ""
echo "🔍 Validating nero-dev-workflow contract..."
echo "   Repo: $ROOT"
echo ""

# --- Required files ---
echo "[ Required Files ]"

test -f "$ROOT/.workflow/policy.md"          && ok "policy.md"           || fail "missing .workflow/policy.md"
test -f "$ROOT/.workflow/router.json"         && ok "router.json"         || fail "missing .workflow/router.json"
test -f "$ROOT/.workflow/handoff/TASK_TEMPLATE.md" && ok "TASK_TEMPLATE.md" || fail "missing .workflow/handoff/TASK_TEMPLATE.md"
test -f "$ROOT/.workflow/skills/nero-dev-workflow/SKILL.md" && ok "SKILL.md (coordinator)" || fail "missing .workflow/skills/nero-dev-workflow/SKILL.md"
test -f "$ROOT/CLAUDE.md"                    && ok "CLAUDE.md (root)"    || fail "missing root CLAUDE.md"
echo ""

# --- Router contract ---
echo "[ Router Contract ]"

if command -v jq > /dev/null 2>&1; then
  jq -e '.default_mode == "normal"' "$ROOT/.workflow/router.json" > /dev/null 2>&1 \
    && ok "router.default_mode = normal" \
    || fail "router.default_mode must be 'normal'"

  jq -e '.overrides["@quick"] == "quick"' "$ROOT/.workflow/router.json" > /dev/null 2>&1 \
    && ok "router.overrides[@quick] = quick" \
    || fail "router missing @quick override"

  jq -e '.overrides["@deep"] == "deep"' "$ROOT/.workflow/router.json" > /dev/null 2>&1 \
    && ok "router.overrides[@deep] = deep" \
    || fail "router missing @deep override"
else
  echo "  ⚠️  jq not found — skipping router JSON validation"
fi
echo ""

# --- Handoff template contract ---
echo "[ Handoff Template ]"

grep -q "approval_gate: none"  "$ROOT/.workflow/handoff/TASK_TEMPLATE.md" \
  && ok "handoff has approval_gate field" \
  || fail "handoff template missing approval_gate"

grep -q "state: idle" "$ROOT/.workflow/handoff/TASK_TEMPLATE.md" \
  && ok "handoff has state field" \
  || fail "handoff template missing state"

grep -q "target_files" "$ROOT/.workflow/handoff/TASK_TEMPLATE.md" \
  && ok "handoff has target_files field" \
  || fail "handoff template missing target_files"
echo ""

# --- Policy content ---
echo "[ Policy Content ]"

grep -q "Isolation First" "$ROOT/.workflow/policy.md" \
  && ok "policy defines Isolation First" \
  || fail "policy missing Isolation First rule"

grep -q "Approval Gate" "$ROOT/.workflow/policy.md" \
  && ok "policy defines Approval Gates" \
  || fail "policy missing Approval Gates"
echo ""

# --- Summary ---
echo "════════════════════════════════"
echo "  PASS: $PASS  |  FAIL: $FAIL"

if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ PASS: workflow contract is valid"
  echo "════════════════════════════════"
  exit 0
else
  echo "  ❌ FAIL: $FAIL issue(s) found above"
  echo "════════════════════════════════"
  exit 1
fi

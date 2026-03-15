#!/bin/bash
# Stop hook - prompts for rebuild if code files were changed
# This runs when Claude finishes responding

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
flag_file="$project_dir/.claude/.rebuild_needed"

if [[ -f "$flag_file" ]]; then
    # Count changed files
    count=$(wc -l < "$flag_file" | tr -d ' ')

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📦 Code changes detected ($count file(s) modified)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Run this to apply changes:"
    echo "  → docker compose build && docker compose up -d"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Clean up flag file
    rm -f "$flag_file"
fi

#!/bin/bash
# PostToolUse hook - tracks when code files are edited
# Creates a flag file if rebuild is needed

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Check if file requires rebuild
if [[ "$file_path" =~ \.(ts|tsx|js|jsx|css)$ ]] || [[ "$file_path" =~ (next\.config|tailwind\.config|docker-compose\.yml|Dockerfile) ]]; then
    # Create flag file in project directory
    flag_file="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/.rebuild_needed"
    touch "$flag_file"
    echo "$file_path" >> "$flag_file"
fi

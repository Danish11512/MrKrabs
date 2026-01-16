#!/bin/bash
# Non-interactive wrapper for drizzle-kit push
# Automatically answers prompts:
# 1. "Is column created or renamed?" -> "create column" (Enter, first option)
# 2. "Do you want to push changes?" -> "Yes" (arrow down + Enter)

# Use expect to handle the interactive prompts
if command -v expect > /dev/null 2>&1; then
  expect << 'EOF'
spawn bunx drizzle-kit push
expect {
  "created or renamed" {
    # Answer: create column (first option, default)
    send "\r"
    exp_continue
  }
  "Do you still want to push changes?" {
    # Answer: Yes (arrow down to second option, then Enter)
    send "\x1b\[B\r"
    exp_continue
  }
  eof
}
EOF
else
  # Fallback: try to pipe Enter keys (may not work for all prompts)
  (echo ""; sleep 2; echo "") | bunx drizzle-kit push
fi

#!/bin/bash

# Sentrya Automated Backup Script
# Creates timestamped git commits to preserve working states

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Get current timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Check if git repo exists, if not initialize it
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - $(date "+%Y-%m-%d %H:%M:%S")"
    echo "Git repository initialized!"
fi

# Add all changes
git add -A

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "No changes to backup at $TIMESTAMP"
else
    # Commit with timestamp
    git commit -m "Auto-backup: $TIMESTAMP"
    echo "✅ Backup created at $TIMESTAMP"
fi

# Optional: Show last 5 commits so you can see your backup history
echo ""
echo "Recent backups:"
git log --oneline -5

#!/bin/bash
# Script to remove .env from git history
# WARNING: This rewrites git history. Coordinate with team before running.

echo "⚠️  WARNING: This will rewrite git history!"
echo "Make sure all team members are aware and have pushed their changes."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "🔍 Checking if .env exists in git history..."
if git log --all --full-history -- .env | grep -q commit; then
    echo "✓ Found .env in git history"
    
    echo "🗑️  Removing .env from git history..."
    git filter-branch --force --index-filter \
        'git rm --cached --ignore-unmatch .env' \
        --prune-empty --tag-name-filter cat -- --all
    
    echo "🧹 Cleaning up..."
    rm -rf .git/refs/original/
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    echo "✅ .env removed from git history"
    echo ""
    echo "⚠️  IMPORTANT: Force push required!"
    echo "Run: git push origin --force --all"
    echo ""
    echo "📢 Notify team members to:"
    echo "1. Commit and push their changes"
    echo "2. Delete their local repo"
    echo "3. Re-clone from origin"
else
    echo "✓ .env not found in git history"
fi

echo ""
echo "✅ Verifying .env is in .gitignore..."
if grep -q "^\.env$" .gitignore || grep -q "^\*\.env$" .gitignore; then
    echo "✓ .env is in .gitignore"
else
    echo "⚠️  Adding .env to .gitignore..."
    echo "*.env" >> .gitignore
    git add .gitignore
    git commit -m "chore: ensure .env is in .gitignore"
fi

echo ""
echo "✅ Done! Remember to:"
echo "1. Copy .env.example to .env"
echo "2. Fill in your actual secrets"
echo "3. Never commit .env again"

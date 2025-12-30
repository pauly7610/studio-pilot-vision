# Package Manager Cleanup Guide

Your repository has both `bun.lockb` and `package-lock.json`, indicating inconsistent package manager usage.

## Current State

```
✗ bun.lockb (201KB)
✗ package-lock.json (261KB)
```

## Recommended: Choose Bun

Bun is faster and more modern. Here's how to standardize on Bun:

### 1. Remove npm artifacts

```bash
# Remove npm lock file
rm package-lock.json

# Add to .gitignore
echo "package-lock.json" >> .gitignore
```

### 2. Reinstall with Bun

```bash
# Clean install
rm -rf node_modules
bun install
```

### 3. Update CI/CD

Update `.github/workflows/frontend-ci.yml`:

```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install

- name: Run tests
  run: bun test

- name: Build
  run: bun run build
```

### 4. Update package.json scripts

Ensure scripts use bun:

```json
{
  "scripts": {
    "dev": "bun run vite",
    "build": "bun run vite build",
    "preview": "bun run vite preview",
    "test": "bun test"
  }
}
```

### 5. Team Communication

Notify team members:

```
📢 We're standardizing on Bun!

Please:
1. Install Bun: curl -fsSL https://bun.sh/install | bash
2. Delete node_modules and package-lock.json
3. Run: bun install
4. Use bun commands: bun run dev, bun test, etc.
```

## Alternative: Choose npm

If you prefer npm (more stable, wider support):

### 1. Remove Bun artifacts

```bash
# Remove bun lock file
rm bun.lockb

# Add to .gitignore
echo "bun.lockb" >> .gitignore
```

### 2. Reinstall with npm

```bash
# Clean install
rm -rf node_modules
npm install
```

### 3. Update CI/CD

Keep using npm in GitHub Actions (already standard).

### 4. Team Communication

```
📢 We're standardizing on npm!

Please:
1. Delete node_modules and bun.lockb
2. Run: npm install
3. Use npm commands: npm run dev, npm test, etc.
```

## Comparison

| Feature | Bun | npm |
|---------|-----|-----|
| Speed | ⚡ 10-20x faster | Standard |
| Compatibility | 95% compatible | 100% compatible |
| Maturity | New (2023) | Mature (2010) |
| Ecosystem | Growing | Complete |
| Runtime | Built-in | Node.js required |
| TypeScript | Native | Via ts-node |

## Recommendation

**For this project: Use Bun**

Reasons:
- Modern React/Vite stack (well supported)
- Speed matters for development
- No legacy dependencies
- Team can adopt easily

## Migration Checklist

- [ ] Choose package manager (Bun or npm)
- [ ] Remove other lock file
- [ ] Update .gitignore
- [ ] Clean install dependencies
- [ ] Update CI/CD workflows
- [ ] Test build and dev server
- [ ] Update documentation
- [ ] Notify team
- [ ] Commit changes

## Commands Reference

### Bun

```bash
bun install              # Install dependencies
bun add <package>        # Add dependency
bun remove <package>     # Remove dependency
bun run <script>         # Run script
bun test                 # Run tests
bun run build            # Build project
```

### npm

```bash
npm install              # Install dependencies
npm install <package>    # Add dependency
npm uninstall <package>  # Remove dependency
npm run <script>         # Run script
npm test                 # Run tests
npm run build            # Build project
```

## After Cleanup

Verify consistency:

```bash
# Check lock file
ls -lh bun.lockb package-lock.json

# Should only see one file
# ✓ bun.lockb (201KB)
# or
# ✓ package-lock.json (261KB)
```

## Troubleshooting

### "Module not found" after switching

```bash
# Clear cache and reinstall
rm -rf node_modules
rm -rf .next .vite dist
bun install  # or npm install
```

### Different versions between developers

```bash
# Lock file is out of sync
git pull
bun install  # or npm install
```

### CI/CD fails after switching

- Update workflow files to use correct package manager
- Clear CI cache
- Verify lock file is committed

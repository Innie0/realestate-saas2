# OneDrive Configuration for Development

## The Problem
Your project is currently in OneDrive (`C:\Users\callo\OneDrive\Desktop\Realestate Saas`), which can cause file locking issues during development because:

1. OneDrive tries to sync files as Next.js writes them
2. This creates "EBUSY: resource busy or locked" errors
3. Development becomes slow and unstable

## Solutions

### Option 1: Exclude Folders from OneDrive Sync (Quick Fix)

Exclude these folders from OneDrive sync:
- `.next/` - Build cache
- `node_modules/` - Dependencies
- `.cache/` - Various caches

**How to exclude in OneDrive:**

1. **Using OneDrive Settings:**
   - Open OneDrive settings (right-click OneDrive icon in system tray)
   - Go to "Settings" → "Backup" → "Manage backup"
   - Uncheck folders you don't want synced

2. **Using File Attributes (Windows):**
   ```powershell
   # Mark .next folder as "always keep on this device"
   attrib +P ".next"
   ```

3. **Using Selective Sync:**
   - Right-click the `Realestate Saas` folder
   - Select "Free up space" for `.next` and `node_modules`

### Option 2: Move Project Outside OneDrive (Recommended)

Move your project to a local directory:

```powershell
# Example locations:
C:\dev\Realestate-Saas
C:\Users\callo\Projects\Realestate-Saas
C:\code\Realestate-Saas
```

**Steps:**
1. Create a projects folder: `mkdir C:\dev`
2. Copy project: `Copy-Item -Recurse "C:\Users\callo\OneDrive\Desktop\Realestate Saas" "C:\dev\Realestate-Saas"`
3. Test it works in the new location
4. Delete the old copy from OneDrive
5. Update your IDE workspace

### Option 3: Use Git for Backup Instead

Instead of relying on OneDrive for version control:

1. **Initialize Git** (if not already done):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub:**
   ```powershell
   # Create a repo on GitHub first, then:
   git remote add origin https://github.com/yourusername/realestate-saas.git
   git branch -M main
   git push -u origin main
   ```

3. **Benefits:**
   - Better version control
   - No file locking issues
   - Can work from any computer
   - Professional workflow

## Current Status

✅ Build cache has been cleaned
✅ `.gitignore` is properly configured
⚠️ Project still in OneDrive (may cause issues)

## Next Steps

1. **Right now:** Restart the dev server to test
2. **Soon:** Consider moving project out of OneDrive
3. **Best practice:** Use Git + GitHub for version control

## Restart Your Dev Server

```powershell
npm run dev
```

The EBUSY errors should be reduced or gone. If they persist, consider Option 2 (moving the project).












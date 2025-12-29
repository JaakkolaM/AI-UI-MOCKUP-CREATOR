# Shortcuts Guide - AI UI Mockup Creator

Quick ways to start the AI UI Mockup Creator app and open it in your browser automatically.

## Option 1: Batch File (Recommended for Windows)

**Double-click:** `start-ai-renderer.bat`

- Opens your default browser to http://localhost:3000
- Starts the Next.js dev server
- Shows server logs in the terminal window

**To stop:** Close the terminal window or press `Ctrl+C`

## Option 2: PowerShell Script

**Right-click** `start-ai-renderer.ps1` → **Run with PowerShell**

- Waits 3 seconds for server to start
- Opens browser automatically
- Cleaner output with colored text

**Note:** If you get a security warning, you may need to allow PowerShell scripts:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Option 3: NPM Script

**In terminal, run:**
```bash
npm run dev:open
```

- Starts server and opens browser automatically
- Works on all platforms
- Waits 3 seconds before opening browser

## Option 4: Create Windows Shortcut

1. **Right-click** on `start-ai-renderer.bat`
2. Select **"Create shortcut"**
3. **Move the shortcut** to your Desktop or Start Menu
4. **(Optional)** Right-click the shortcut → Properties → Change Icon

Now you can start the app with a single click from your desktop!

## Tips

- **Faster startup:** Keep the terminal window open between sessions
- **Port already in use?** Close any running Node processes:
  ```bash
  npx kill-port 3000
  ```
- **Browser not opening?** Manually go to: http://localhost:3000

## What Happens

1. Terminal/Command window opens
2. Changes to project directory
3. Runs `npm run dev`
4. Browser opens to http://localhost:3000 (after 3 seconds)
5. App is ready to use!





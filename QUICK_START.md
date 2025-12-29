# Quick Start Guide

## 1. Get Your API Key (2 minutes)

### Google Gemini API Key (FREE)
👉 **Go here:** [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

1. Sign in with Google
2. Click "**Create API Key**"
3. Copy the key (starts with `AIza...`)

## 2. Create .env.local File

In your project root folder, create a file named `.env.local`:

```env
GOOGLE_GEMINI_API_KEY=AIzaSyD...your_gemini_key_here
```

**📁 File location:**
```
AI-UI-Mockup-Creator/
├── app/
├── components/
├── lib/
├── .env.local          ← Create this file here!
├── package.json
└── README.md
```

## 3. Install & Run

```bash
# Install dependencies
npm install

# Start the app
npm run dev
```

## 4. Test AI Generation

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "**AI Generate**" button in the header
3. Enter a prompt: "a beautiful sunset over mountains"
4. Click "**Generate Image**"
5. Wait ~5 seconds
6. Click "**Add to Canvas**"

## 5. Try Canvas Sketch Feature

1. Draw something on the canvas (a simple house, sun, tree, etc.)
2. Click "**AI Generate**"
3. Enter prompt: "make this a beautiful painting"
4. ✅ Check "**Use canvas as reference**"
5. Click "**Generate Image**"
6. Gemini will analyze your sketch and enhance the prompt!

## Troubleshooting

### "API key not configured" error
- Make sure `.env.local` file exists in the project root
- Check that your API key is added correctly
- Restart the dev server: Stop it (Ctrl+C) and run `npm run dev` again

### Image generation fails
- Verify your API key is correct (starts with `AIza`)
- Check Google AI Studio quota limits:
  - **FREE tier**: 15 requests/minute, 1,500/day
  - Nano Banana models may have additional limits
- Try "Preview" mode first (faster)
- Check the browser console for error messages

### Images not appearing
- Ensure you're using the latest Gemini API with image generation support
- Some models may not be available in all regions
- Check the API response in browser dev tools (Network tab)

## What's Next?

- Experiment with different prompts
- Try drawing sketches and using them as references
- Adjust shadow effects on generated images
- Export your creations as PNG or SVG

Enjoy creating! 🎨✨


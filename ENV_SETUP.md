# Environment Variables Setup for AI UI Mockup Creator

To enable AI image generation in AI UI Mockup Creator, you need to create a `.env.local` file in the root directory with your **Google Gemini API key**.

## Step 1: Get Google Gemini API Key (FREE)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "**Get API Key**" or "**Create API Key**"
4. Copy your API key (starts with `AIza...`)

**What it does:** 
- Analyzes your canvas sketches
- Generates images using Nano Banana models
- Enhances your prompts for better results

## Step 2: Create .env.local File

Create a file named `.env.local` in the root directory:

```env
# Google Gemini API Key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

Replace `your_gemini_api_key_here` with your actual API key.

## Step 3: Restart Development Server

If the dev server is running, restart it to load the new environment variables:

```bash
npm run dev
```

## How Gemini's Image Generation Works

Google Gemini now includes image generation through their "Nano Banana" models:

1. 🎨 **Nano Banana** (Gemini 2.5 Flash Image):
   - Fast generation with low latency
   - Perfect for previews and quick iterations
   - High speed, good quality

2. 🎨 **Nano Banana Pro** (Gemini 3 Pro Image):
   - 4K resolution output
   - "Thinking" mode for complex reasoning
   - High-fidelity, professional quality
   
3. 🧠 **Canvas Analysis**:
   - Uses Gemini vision to understand your sketches
   - Enhances prompts based on visual elements
   - Combines text + image for better results

## Important Notes

- ⚠️ **Never commit `.env.local` to Git** - it's already in `.gitignore`
- The `.env.local` file should only exist on your local machine
- Each developer/deployment needs their own API key
- Only one API key needed - simple and free!

## Pricing

**Google Gemini API:**
- ✅ **FREE** tier available
  - 15 requests per minute
  - 1,500 requests per day
  - Perfect for development and personal projects

- 💰 **Paid tier** (if you exceed free limits):
  - Check current pricing at [ai.google.dev/pricing](https://ai.google.dev/pricing)
  - Nano Banana models are very cost-effective

**Note:** Image generation models may have different rate limits than text models. Check the [Google AI Studio documentation](https://ai.google.dev/gemini-api/docs) for the latest information.


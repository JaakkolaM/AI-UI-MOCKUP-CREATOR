# Environment Variables Setup for AI UI Mockup Creator

To enable AI features in AI UI Mockup Creator, you can use either Google's Gemini API or OpenRouter with Zhipu AI's GLM-4.6v model.

## Step 1: Choose Your AI Provider

You have two options:

### Option A: Google Gemini API (Cloud-based)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "**Get API Key**" or "**Create API Key**"
4. Copy your API key (starts with `AIza...`)

**What it does:**
- Analyzes your canvas sketches
- Generates images using Nano Banana models
- Enhances your prompts for better results
- Generates UI code with visual understanding

### Option B: OpenRouter with GLM-4.6v (Cloud-based)

1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Sign in or create an account
3. Click "**Create API Key**"
4. Copy your API key
5. The default model is `z-ai/glm-4.6v` (a powerful vision-language model by Zhipu AI)

**What it does:**
- Analyzes your canvas sketches with excellent visual understanding
- Generates UI code with strong adherence to reference images
- Supports both text and vision capabilities with proper image handling
- Available models: GLM-4.6v (recommended), Qwen 3 VL

## Step 2: Create .env.local File

Create a file named `.env.local` in the root directory:

```env
# Google Gemini API Key (required if using Gemini)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter API Key (required if using OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenRouter Model Configuration (optional)
OPENROUTER_DEFAULT_MODEL=z-ai/glm-4.6v
```

Replace `your_gemini_api_key_here` and `your_openrouter_api_key_here` with your actual API keys.

## Step 3: Restart Development Server

If the dev server is running, restart it to load the new environment variables:

```bash
npm run dev
```

## How the AI Providers Work

### With Google Gemini (Cloud-based)
Google Gemini includes image generation through their "Nano Banana" models:

1. 🎨 **Nano Banana** (Gemini 2.5 Flash Image):
   - Fast generation with low latency
   - Perfect for previews and quick iterations
   - High speed, good quality

2. 🎨 **Nano Banana Pro** (Gemini 3 Pro Image):
   - 4K resolution output
   - "Thinking" mode for complex reasoning
   - High-fidelity, professional quality

3. 🧠 **Canvas & Reference Analysis**:
   - Uses Gemini vision to understand your sketches
   - Analyzes reference images for style, colors, and layout
   - Enhances prompts based on visual elements
   - Combines text + image for better results

### With OpenRouter GLM-4.6v (Cloud-based)
- Uses Zhipu AI's GLM-4.6v model, a powerful vision-language model
- Properly processes both text and image inputs using OpenRouter's multimodal API
- Excellent understanding of UI/UX patterns and design principles
- Strong adherence to reference images for accurate style matching
- High-quality text generation for UI code

## Important Notes

- ⚠️ **Never commit `.env.local` to Git** - it's already in `.gitignore`
- The `.env.local` file should only exist on your local machine
- Each developer/deployment needs their own API keys
- You can use both providers simultaneously or choose one

## Pricing

**Google Gemini API:**
- ✅ **FREE** tier available
  - 15 requests per minute
  - 1,500 requests per day
  - Perfect for development and personal projects

- 💰 **Paid tier** (if you exceed free limits):
  - Check current pricing at [ai.google.dev/pricing](https://ai.google.dev/pricing)
  - Nano Banana models are very cost-effective

**OpenRouter:**
- 💰 **Pay-per-use** pricing
  - Check current pricing at [openrouter.ai/models](https://openrouter.ai/models)
  - GLM-4.6v offers competitive pricing for a powerful model
  - No free tier, but very affordable for most use cases

**Note:** Image generation models may have different rate limits than text models. Check the respective provider's documentation for the latest information.
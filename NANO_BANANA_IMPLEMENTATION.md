# Nano Banana Implementation for AI UI Mockup Creator

## What is Nano Banana?

"**Nano Banana**" and "**Nano Banana Pro**" are Google's internal codenames for their latest Gemini image generation models, officially integrated into the Gemini API.

### Model Details:

| Model Name | Marketing Name | Technical ID | Key Features |
|------------|----------------|--------------|--------------|
| Nano Banana | Gemini 2.5 Flash Image | `gemini-2.5-flash-image` | High speed, low latency |
| Nano Banana Pro | Gemini 3 Pro Image | `gemini-3-pro-image-preview` | 4K resolution, "Thinking" mode, high-fidelity |

## Implementation

### API Route: `app/api/generate/route.ts`

The implementation uses Google's Generative AI SDK:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize with API key from AI Studio
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Select model based on quality
const modelName = quality === 'final' 
  ? 'gemini-3-pro-image-preview'  // Nano Banana Pro
  : 'gemini-2.5-flash-image';      // Nano Banana

const model = genAI.getGenerativeModel({ model: modelName });
```

### Canvas Analysis Feature

When "Use canvas as reference" is checked:

1. **Vision Analysis**: Uses `gemini-2.0-flash-exp` to analyze the canvas sketch
2. **Prompt Enhancement**: Gemini describes the sketch and combines it with the user's text prompt
3. **Image Generation**: Enhanced prompt is sent to the Nano Banana model along with the reference image
4. **Result**: More accurate image generation that respects both text and visual input

### Response Format

Gemini image models return base64-encoded images in the response:

```typescript
const imagePart = candidates[0].content.parts.find(part => part.inlineData);
const imageBase64 = imagePart.inlineData.data;
const imageUrl = `data:${mimeType};base64,${imageBase64}`;
```

## Setup

### 1. Get API Key (FREE)

Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create an API key.

### 2. Add to .env.local

```env
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### 3. Done!

Just one API key needed - no additional services or complex setup.

## Advantages Over Previous Implementation

### Before (Hybrid Approach):
- ❌ Required 2 API keys (Gemini + Replicate)
- ❌ More complex setup
- ❌ Two separate services to manage
- ❌ Additional costs from Replicate

### Now (Pure Gemini):
- ✅ Only 1 API key needed
- ✅ Simple setup from AI Studio
- ✅ FREE tier available (1,500 requests/day)
- ✅ Native canvas analysis + generation
- ✅ Consistent Google ecosystem

## Rate Limits (FREE Tier)

- **Requests per minute**: 15
- **Requests per day**: 1,500
- **Perfect for**: Development, personal projects, demos

For production with higher limits, see [Google AI pricing](https://ai.google.dev/pricing).

## Quality Modes

### Preview Mode (Nano Banana)
- **Model**: `gemini-2.5-flash-image`
- **Speed**: Fast (low latency)
- **Use for**: Quick iterations, previews, testing prompts
- **Quality**: Good, optimized for speed

### Final Mode (Nano Banana Pro)
- **Model**: `gemini-3-pro-image-preview`
- **Resolution**: Up to 4K
- **Features**: "Thinking" mode for complex reasoning
- **Use for**: Final renders, high-quality outputs, professional use
- **Quality**: Excellent, high-fidelity

## Testing

To test the implementation:

1. Add your Gemini API key to `.env.local`
2. Run `npm run dev`
3. Click "AI Generate" in the header
4. Try these test prompts:
   - Simple: "a sunset over mountains"
   - Complex: "a photorealistic portrait of a cyberpunk character with neon lighting"
   - With sketch: Draw a simple shape, check "Use canvas as reference", prompt: "make this a beautiful illustration"

## Troubleshooting

### "Model not found" errors
- Ensure you're using the correct model IDs
- Check if Nano Banana models are available in your region
- Try the older models as fallback if needed

### API key errors
- Verify key starts with `AIza`
- Check it's added correctly in `.env.local`
- Restart dev server after adding key

### Rate limit errors
- FREE tier: 15/min, 1,500/day
- Wait a minute if you hit the limit
- Consider upgrading for higher limits

## References

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini API Pricing](https://ai.google.dev/pricing)





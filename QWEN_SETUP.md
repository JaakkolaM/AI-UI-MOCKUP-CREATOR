# Using Qwen3-VL as an Alternative to Gemini

This document explains how to set up and use the Qwen3-VL model as an alternative to Google's Gemini API in the AI UI Mockup Creator.

## Prerequisites

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull the Qwen3-VL model:
   ```bash
   ollama pull qwen3-vl:2b
   ```
   Or for better quality (but slower performance):
   ```bash
   ollama pull qwen3-vl:4b
   ```
   Or for the largest model:
   ```bash
   ollama pull qwen3-vl:7b
   ```

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```env
# Ollama Configuration (optional - defaults shown)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=qwen3-vl:2b

# Gemini Configuration (still needed for fallback)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

### Selecting the Provider

In the UI, you can now select between two providers:

1. **Gemini** - Uses Google's Gemini API (requires API key)
2. **Ollama (Qwen3-VL)** - Uses local Qwen3-VL model (requires Ollama to be running)

### API Usage

The API endpoints accept an optional `provider` parameter:

- `/api/generate-ui` - For UI code generation
- `/api/generate` - For image generation

Example request:
```json
{
  "prompt": "Create a modern login form",
  "provider": "ollama",
  "useCanvas": false
}
```

## Limitations

### Image Generation

Currently, Ollama does not have native image generation capabilities like Gemini. When using the Ollama provider for image generation:

- The prompt will be enhanced using Qwen3-VL
- No actual image will be generated
- A message will indicate that image generation requires a separate service

For image generation, you'll need to continue using the Gemini provider or integrate with a separate image generation service (like Stable Diffusion).

### Performance

- Qwen3-VL runs locally, so responses don't depend on internet connectivity
- Initial startup may be slower as the model loads into memory
- Subsequent requests are typically faster than API calls to remote services

## Troubleshooting

### Ollama Not Accessible

If you get an error about Ollama not being accessible:

1. Ensure Ollama is running: `ollama serve`
2. Verify the model is pulled: `ollama list`
3. Check that the base URL matches your Ollama configuration

### Model Not Found

If you get a "model not found" error:

1. Pull the model: `ollama pull qwen3-vl:2b`
2. Verify the model name matches your environment configuration
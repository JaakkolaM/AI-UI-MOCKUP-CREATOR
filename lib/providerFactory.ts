// lib/providerFactory.ts
import { ProviderType, AIProvider } from './aiProvider';
import { GeminiProvider } from './providers/geminiProvider';
import { OpenRouterProvider } from './providers/openRouterProvider';

// Re-export ProviderType so it can be imported from this module
export { ProviderType };

export async function createProvider(providerType: ProviderType, model?: string): Promise<AIProvider> {
  switch (providerType) {
    case ProviderType.GEMINI:
      const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Google Gemini API key is not configured');
      }
      // Default to a vision model for image-related tasks
      return new GeminiProvider(geminiApiKey, 'gemini-2.0-flash-exp');

    case ProviderType.OPENROUTER:
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        throw new Error('OpenRouter API key is not configured. Please add OPENROUTER_API_KEY to your .env.local file.');
      }
      let openRouterModel = model || process.env.OPENROUTER_DEFAULT_MODEL || 'z-ai/glm-4.6v';
      
      // Map model name to OpenRouter model ID
      if (openRouterModel === 'glm-4.6v') {
        openRouterModel = 'z-ai/glm-4.6v';
      } else if (openRouterModel === 'qwen3-vl') {
        openRouterModel = 'qwen/qwen3-vl-235b-a22b-instruct';
      }
      
      return new OpenRouterProvider(openRouterApiKey, openRouterModel);

    default:
      throw new Error(`Unsupported provider type: ${providerType}`);
  }
}

export function getAvailableProviders(): ProviderType[] {
  const providers: ProviderType[] = [];
  
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    providers.push(ProviderType.GEMINI);
  }
  
  if (process.env.OPENROUTER_API_KEY) {
    providers.push(ProviderType.OPENROUTER);
  }
  
  return providers;
}
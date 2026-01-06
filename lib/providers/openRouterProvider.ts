// lib/providers/openRouterProvider.ts
import { AIProvider, Content, GenerationConfig, GenerateContentResult, Part } from '../aiProvider';

interface OpenRouterMessage {
  role: string;
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    };
  }>;
  model: string;
}

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(
    apiKey: string,
    defaultModel: string = 'z-ai/glm-4.6v'
  ) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async generateContent(
    contents: Content[],
    generationConfig?: GenerationConfig
  ): Promise<GenerateContentResult> {
    try {
      // Convert Gemini-style contents to OpenRouter messages
      const messages: OpenRouterMessage[] = [];
      
      for (const content of contents) {
        const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
        
        for (const part of content.parts) {
          if ('text' in part) {
            contentParts.push({
              type: 'text',
              text: part.text
            });
          } else if ('inlineData' in part) {
            // Convert Gemini inlineData to OpenRouter image_url format
            // OpenRouter expects: { type: 'image_url', image_url: { url: 'data:image/...;base64,...' } }
            const mimeType = part.inlineData.mimeType || 'image/png';
            const base64Data = part.inlineData.data;
            const imageUrl = `data:${mimeType};base64,${base64Data}`;
            
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            });
          }
        }
        
        messages.push({
          role: content.role,
          content: contentParts
        });
      }

      const requestBody: OpenRouterRequest = {
        model: this.defaultModel,
        messages,
        stream: false
      };

      // Add generation config parameters if provided
      if (generationConfig) {
        if (generationConfig.temperature !== undefined) {
          requestBody.temperature = generationConfig.temperature;
        }
        if (generationConfig.topP !== undefined) {
          requestBody.top_p = generationConfig.topP;
        }
        if (generationConfig.topK !== undefined) {
          requestBody.top_k = generationConfig.topK;
        }
        if (generationConfig.maxOutputTokens !== undefined) {
          requestBody.max_tokens = generationConfig.maxOutputTokens;
        }
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-ui-mockup-creator.vercel.app',
          'X-Title': 'AI UI Mockup Creator'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      // Handle response content (could be string or array)
      const responseContent = data.choices[0].message.content;
      const responseText = typeof responseContent === 'string' 
        ? responseContent 
        : responseContent.map(part => part.text || '').join('');
      
      return {
        response: {
          text: () => responseText,
          candidates: [{
            content: {
              parts: [{ text: responseText }]
            }
          }]
        }
      };
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  // For image generation, we'll enhance the prompt and return it
  // since GLM-4.6v is primarily a text/vision model, not an image generation model
  async generateImage(
    contents: Content[],
    generationConfig?: GenerationConfig
  ): Promise<{ inlineData: { mimeType: string; data: string } }> {
    // For now, we'll generate text content (enhanced prompt) instead of an image
    // since GLM-4.6v is a text/vision model, not an image generation model
    const result = await this.generateContent(contents, generationConfig);
    const enhancedPrompt = result.response.text();

    // Return a placeholder response with the enhanced prompt as text
    // In a real implementation, you might connect to a different service for image generation
    return {
      inlineData: {
        mimeType: 'text/plain',
        data: Buffer.from(enhancedPrompt).toString('base64')
      }
    };
  }
}
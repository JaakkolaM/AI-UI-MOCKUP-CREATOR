// lib/providers/geminiProvider.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, Content, GenerationConfig, GenerateContentResult } from '../aiProvider';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async generateContent(
    contents: Content[],
    generationConfig?: GenerationConfig
  ): Promise<GenerateContentResult> {
    const genModel = this.genAI.getGenerativeModel({ model: this.model });

    const requestOptions: any = {
      contents,
    };

    if (generationConfig) {
      requestOptions.generationConfig = {
        ...(generationConfig.temperature !== undefined && { temperature: generationConfig.temperature }),
        ...(generationConfig.topP !== undefined && { topP: generationConfig.topP }),
        ...(generationConfig.topK !== undefined && { topK: generationConfig.topK }),
        ...(generationConfig.maxOutputTokens !== undefined && { maxOutputTokens: generationConfig.maxOutputTokens }),
      };
    }

    const result = await genModel.generateContent(requestOptions);

    // Convert the Gemini response to our interface
    return {
      response: {
        text: () => {
          const response = result.response;
          return response.text();
        },
        candidates: result.response.candidates?.map(candidate => ({
          content: {
            parts: candidate.content.parts as any // Type assertion to match our interface
          }
        }))
      }
    };
  }

  // For image generation, we'll use the image generation models
  async generateImage(
    contents: Content[],
    generationConfig?: GenerationConfig
  ): Promise<{ inlineData: { mimeType: string; data: string } }> {
    // For image generation, we need to use a model specifically designed for it
    // This method is primarily for consistency with the interface
    // The actual image generation happens in the API route
    const genModel = this.genAI.getGenerativeModel({ model: this.model });

    const requestOptions: any = {
      contents,
    };

    if (generationConfig) {
      requestOptions.generationConfig = {
        ...(generationConfig.temperature !== undefined && { temperature: generationConfig.temperature }),
        ...(generationConfig.topP !== undefined && { topP: generationConfig.topP }),
        ...(generationConfig.topK !== undefined && { topK: generationConfig.topK }),
        ...(generationConfig.maxOutputTokens !== undefined && { maxOutputTokens: generationConfig.maxOutputTokens }),
      };
    }

    const result = await genModel.generateContent(requestOptions);
    const response = await result.response;

    // Extract image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No content generated');
    }

    const imagePart = candidates[0].content.parts.find((part: any) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      throw new Error('No image data in response');
    }

    return imagePart;
  }
}
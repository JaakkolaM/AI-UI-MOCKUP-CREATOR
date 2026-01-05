// lib/aiProvider.ts
export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export interface TextPart {
  text: string;
}

export type Part = ImagePart | TextPart;

export interface Content {
  role: string;
  parts: Part[];
}

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export interface GenerateContentResult {
  response: {
    text: () => string;
    candidates?: Array<{
      content: {
        parts: Part[];
      };
    }>;
  };
}

export interface AIProvider {
  generateContent(contents: Content[], generationConfig?: GenerationConfig): Promise<GenerateContentResult>;
  generateImage?(contents: Content[], generationConfig?: GenerationConfig): Promise<{ inlineData: { mimeType: string; data: string } }>;
}

export enum ProviderType {
  GEMINI = 'gemini',
  OPENROUTER = 'openrouter'
}
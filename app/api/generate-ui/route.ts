import { NextRequest } from 'next/server';
import { createProvider, ProviderType } from '@/lib/providerFactory';
import { Content } from '@/lib/aiProvider';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      canvasImage,
      useCanvas,
      model,
      openRouterModel,
      referenceImages,
      canvasDimensions,
      provider = 'gemini' // Default to gemini for backward compatibility
    } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Determine which provider to use
    let providerType: ProviderType;
    switch (provider.toLowerCase()) {
      case 'openrouter':
        providerType = ProviderType.OPENROUTER;
        break;
      case 'ollama':
        providerType = ProviderType.GEMINI; // Fall back to Gemini for backward compatibility
        break;
      default:
        providerType = ProviderType.GEMINI;
    }
    const aiProvider = await createProvider(providerType, openRouterModel);

    // Prepare the content for the model
    let content: any[] = [];

    // Add the main prompt
    content.push({
      text: `Generate Tailwind CSS UI code based on this description: "${prompt}". `
    });

    // Add canvas as reference if requested
    if (useCanvas && canvasImage) {
      const [dataHeader, imageData] = canvasImage.split(',');
      const mimeType = dataHeader.match(/:(.*?);/)?.[1] || 'image/png';

      content.push({
        inlineData: {
          data: imageData,
          mimeType: mimeType
        }
      });

      content.push({
        text: "Use this canvas image as a reference for the UI layout and elements. "
      });
    }

    // Add reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      for (const refImage of referenceImages) {
        const [dataHeader, imageData] = refImage.split(',');
        const mimeType = dataHeader.match(/:(.*?);/)?.[1] || 'image/png';

        content.push({
          inlineData: {
            data: imageData,
            mimeType: mimeType
          }
        });
      }

      content.push({
        text: "Also use these reference images to guide the UI design, style, and layout. "
      });
    }

    // Add instructions for the output format
    content.push({
      text: `Generate only the HTML code with Tailwind CSS classes for the specific UI mockup. The UI should be responsive and match the dimensions of ${canvasDimensions.width}x${canvasDimensions.height}px. Do not include <!DOCTYPE html>, <html>, <head>, or <body> tags. Only return the specific UI component or section with appropriate Tailwind classes. Focus on the visual elements and layout without generating full page structure.`
    });

    // Create content structure for the provider
    const providerContent: Content[] = [{
      role: 'user',
      parts: content
    }];

    // Use the provider to generate content
    const result = await aiProvider.generateContent(providerContent, {
      temperature: 0.5,
      maxOutputTokens: 16384,
    });

    const text = result.response.text();

    // Extract HTML code if it's wrapped in markdown code blocks
    let uiCode = text.trim();
    if (uiCode.startsWith('```html') && uiCode.endsWith('```')) {
      uiCode = uiCode.substring(7, uiCode.length - 3); // Remove ```html and ```
    } else if (uiCode.startsWith('```') && uiCode.endsWith('```')) {
      uiCode = uiCode.substring(3, uiCode.length - 3); // Remove ``` and ```
    }

    return Response.json({
      success: true,
      uiCode: uiCode,
      outputWidth: canvasDimensions.width,
      outputHeight: canvasDimensions.height,
      provider: providerType
    });
  } catch (error: any) {
    console.error('UI generation error:', error);
    return Response.json({ error: error.message || 'Failed to generate UI' }, { status: 500 });
  }
}
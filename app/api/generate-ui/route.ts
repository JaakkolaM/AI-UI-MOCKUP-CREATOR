import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { prompt, canvasImage, useCanvas, model, referenceImages, canvasDimensions } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return Response.json({ error: 'Google Gemini API key is not configured' }, { status: 500 });
    }

    // Prepare the content for the model
    const selectedModel = model === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const genModel = genAI.getGenerativeModel({ model: selectedModel });

    let content = [];

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

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: content }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 16384,
      },
    });

    const response = await result.response;
    const text = response.text();

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
      outputHeight: canvasDimensions.height
    });
  } catch (error: any) {
    console.error('UI generation error:', error);
    return Response.json({ error: error.message || 'Failed to generate UI' }, { status: 500 });
  }
}
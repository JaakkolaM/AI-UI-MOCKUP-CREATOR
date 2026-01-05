import { NextRequest, NextResponse } from 'next/server';
import { lightingPresets } from '@/lib/presets';
import sharp from 'sharp';
import { ASPECT_RATIOS, computeTargetFromLongEdge, makeEvenDimensions } from '@/lib/sizing';
import { createProvider, ProviderType } from '@/lib/providerFactory';
import { Content } from '@/lib/aiProvider';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      canvasImage,
      useCanvas,
      quality,
      preset,
      materialReference,
      materialWeight,
      materialReferences,
      outputMode = 'canvas',
      outputLongEdge = 2048,
      outputAspectRatio = '1:1',
      outputWidth,
      outputHeight,
      provider = 'gemini', // Default to gemini for backward compatibility
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
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
    const aiProvider = await createProvider(providerType);

    // Select model based on quality and provider
    let modelName: string;
    if (providerType === ProviderType.OPENROUTER) {
      // For OpenRouter, we'll use the default model specified in environment
      modelName = process.env.OPENROUTER_DEFAULT_MODEL || 'z-ai/glm-4.6v';
    } else {
      // For Gemini, use the existing model selection logic
      modelName = quality === 'final'
        ? 'gemini-3-pro-image-preview'
        : 'gemini-2.5-flash-image';
    }

    let finalPrompt = prompt;

    // Add lighting preset to prompt if selected
    if (preset && preset !== 'none' && lightingPresets[preset]) {
      const presetPrompt = lightingPresets[preset].prompt;
      finalPrompt = `${prompt}. Environment: ${presetPrompt}.`;
    }

    // If canvas is provided, analyze it first to enhance the prompt
    if (useCanvas && canvasImage) {
      try {
        const base64Data = canvasImage.replace(/^data:image\/\w+;base64,/, '');

        const visionPrompt = `Analyze this sketch/image and enhance the following prompt for AI image generation: "${prompt}".
 Combine the visual elements from the sketch with the text description to create a detailed, comprehensive prompt.
 Focus on: style, composition, colors, mood, and key elements.
 Respond ONLY with the enhanced prompt, no other text.`;

        // Create content for the provider
        const visionContent: Content[] = [{
          role: 'user',
          parts: [
            { text: visionPrompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data,
              },
            }
          ]
        }];

        // Use the provider to enhance the prompt
        const visionResult = await aiProvider.generateContent(visionContent, {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
        });

        finalPrompt = visionResult.response.text().trim();
        console.log(`${providerType} enhanced prompt with canvas:`, finalPrompt);
      } catch (visionError) {
        console.error('Vision analysis error:', visionError);
        // Continue with original prompt if vision fails
      }
    }

    // Determine target output size
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const maxLongEdge = 4096;
    const minEdge = 64;

    let targetWidth: number;
    let targetHeight: number;

    if (outputMode === 'canvas' && Number.isFinite(outputWidth) && Number.isFinite(outputHeight)) {
      targetWidth = Math.round(Number(outputWidth));
      targetHeight = Math.round(Number(outputHeight));
    } else {
      const longEdge = clamp(Math.round(Number(outputLongEdge) || 2048), minEdge, maxLongEdge);
      const aspect = (ASPECT_RATIOS as readonly string[]).includes(outputAspectRatio)
        ? (outputAspectRatio as any)
        : '1:1';
      const t = computeTargetFromLongEdge(longEdge, aspect);
      targetWidth = t.width;
      targetHeight = t.height;
    }

    // Cap "use canvas size" to maxLongEdge while preserving aspect
    const currentLongEdge = Math.max(targetWidth, targetHeight);
    if (currentLongEdge > maxLongEdge) {
      const scale = maxLongEdge / currentLongEdge;
      targetWidth = Math.max(minEdge, Math.round(targetWidth * scale));
      targetHeight = Math.max(minEdge, Math.round(targetHeight * scale));
    }

    // Make even for better compatibility in some pipelines
    ({ width: targetWidth, height: targetHeight } = makeEvenDimensions({ width: targetWidth, height: targetHeight }));

    const promptBeforeConstraints = finalPrompt;
    // Add output constraints to prompt as a hint (server still enforces exact size via resizing)
    finalPrompt = `${finalPrompt}\n\nOutput constraints: ${targetWidth}x${targetHeight}px. Fill the frame edge-to-edge. No borders.`;

    // Build request parts - order matters for multi-image input
    const parts: any[] = [];

    // Add material reference instruction + images first (if provided)
    // Supports both legacy single image fields and new multi-image array.
    const normalizedMaterialRefs: Array<{ dataUrl: string; weight?: number }> = Array.isArray(materialReferences)
      ? materialReferences
      : materialReference
        ? [{ dataUrl: materialReference, weight: materialWeight }]
        : [];

    for (const ref of normalizedMaterialRefs.slice(0, 8)) {
      if (!ref?.dataUrl) continue;
      const intensity = Math.round(((ref.weight ?? 0.7) as number) * 100);
      parts.push({
        text: `Material reference (${intensity}%): analyze color, surface properties, reflectivity, and grain pattern, then apply these properties to the product surface:`,
      });

      const mimeMatch = ref.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const mimeType = mimeMatch?.[1] || 'image/png';
      const materialBase64 = ref.dataUrl.replace(/^data:image\/\w+;base64,/, '').replace(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/, '');

      parts.push({
        inlineData: {
          mimeType,
          data: materialBase64,
        },
      });
    }

    // Add the main prompt
    parts.push({ text: finalPrompt });

    // Add canvas sketch reference if provided
    if (useCanvas && canvasImage) {
      const base64Data = canvasImage.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data,
        },
      });
    }

    // Create content for image generation
    const imageContent: Content[] = [{
      role: 'user',
      parts
    }];

    // Use the provider to generate content
    // For now, we'll continue using the existing image generation approach for Gemini
    // since OpenRouter GLM-4.6v doesn't have native image generation capabilities
    if (providerType === ProviderType.GEMINI) {
      // Use the original Gemini approach for image generation
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;

      if (!geminiApiKey) {
        return NextResponse.json(
          { error: 'Google Gemini API key not configured. Please add GOOGLE_GEMINI_API_KEY to your .env.local file.' },
          { status: 500 }
        );
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);

      const imageModel = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: "You are a specialized Product Visualization Engine. Your task is to interpret sketches or CAD drawings and render them as finished physical products. Always prioritize physical accuracy and realistic materials. When provided with a material reference image, carefully analyze its color, grain, texture, and reflectivity, and apply those exact properties to the primary object in the sketch. Maintain photorealistic quality and professional lighting."
      });

      const result = await imageModel.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
        },
      });

      const response = await result.response;

      // Extract generated image from response
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No image generated');
      }

      const imagePart = candidates[0].content.parts.find((part: any) => part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image data in response');
      }

      const imageBase64 = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType || 'image/png';

      // Enforce exact output size (cover/crop)
      const inputBuffer = Buffer.from(imageBase64, 'base64');
      const resizedBuffer = await sharp(inputBuffer)
        .resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer();

      const resizedBase64 = resizedBuffer.toString('base64');
      const imageUrl = `data:image/png;base64,${resizedBase64}`;

      return NextResponse.json({
        success: true,
        imageUrl: imageUrl,
        model: modelName,
        enhancedPrompt: promptBeforeConstraints !== prompt ? promptBeforeConstraints : undefined,
        outputWidth: targetWidth,
        outputHeight: targetHeight,
        sourceMimeType: mimeType,
        provider: providerType,
      });
    } else {
      // For OpenRouter, we'll enhance the prompt but won't generate an image
      // since GLM-4.6v doesn't have native image generation capabilities
      // In a future implementation, you could connect to a different service for image generation
      return NextResponse.json({
        success: true,
        model: modelName,
        enhancedPrompt: finalPrompt,
        outputWidth: targetWidth,
        outputHeight: targetHeight,
        provider: providerType,
        message: "Prompt enhanced using OpenRouter GLM-4.6v. Image generation requires a separate service."
      });
    }

  } catch (error: any) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}


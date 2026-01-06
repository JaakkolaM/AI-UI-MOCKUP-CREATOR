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
      provider = 'gemini',
      canvasStrength = 60,
      referenceStrength = 70
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
      default:
        providerType = ProviderType.GEMINI;
    }
    const aiProvider = await createProvider(providerType, openRouterModel);

    // Calculate temperature based on strength settings and provider/model
    // Higher strength = lower temperature (more deterministic)
    // Lower strength = higher temperature (more creative)
    const maxStrength = Math.max(canvasStrength, referenceStrength);
    let temperature: number;

    // Provider-specific optimizations
    if (providerType === ProviderType.OPENROUTER) {
      // GLM-4.6v: Best performer - use slightly lower base temperature
      if (openRouterModel?.includes('glm-4.6v') || openRouterModel?.includes('glm')) {
        if (maxStrength > 70) {
          temperature = 0.2; // Strict adherence for GLM-4.6v
        } else if (maxStrength > 40) {
          temperature = 0.25; // Balanced for GLM-4.6v
        } else {
          temperature = 0.35; // More creative for GLM-4.6v
        }
      }
      // Qwen3-VL: Often fails - use lower temperature for stability
      else if (openRouterModel?.includes('qwen')) {
        if (maxStrength > 70) {
          temperature = 0.15; // Very strict for Qwen stability
        } else if (maxStrength > 40) {
          temperature = 0.2; // Low temp for Qwen
        } else {
          temperature = 0.3; // Minimal creativity for Qwen
        }
      } else {
        // Default OpenRouter settings
        if (maxStrength > 70) {
          temperature = 0.2;
        } else if (maxStrength > 40) {
          temperature = 0.3;
        } else {
          temperature = 0.5;
        }
      }
    } else {
      // Gemini: Weakest performer - use higher temperature to compensate
      if (maxStrength > 70) {
        temperature = 0.3; // Moderate strictness for Gemini
      } else if (maxStrength > 40) {
        temperature = 0.4; // Balanced for Gemini
      } else {
        temperature = 0.6; // More creative for Gemini (default was 0.5)
      }
    }

    // Prepare the content for the model
    const providerContent: Content[] = [];

    // System instruction
    const systemInstruction = `You are an expert UI/UX Designer and Frontend Developer specializing in modern web interfaces.
Your task is to generate high-quality, production-ready HTML code with Tailwind CSS classes.

Key principles:
1. Use semantic HTML5 elements
2. Apply Tailwind CSS utility classes efficiently
3. Create responsive, accessible designs
4. Follow modern design patterns (cards, flexbox, grid, etc.)
5. Ensure proper spacing, typography hierarchy, and visual consistency
6. Include hover states and interactive elements where appropriate
7. Use realistic placeholder content that matches the UI purpose

When provided with reference images:
- Carefully analyze color palettes, typography, spacing, and layout patterns
- Extract specific design system details (hex codes, font sizes, border radius, etc.)
- Apply these design patterns to match the reference aesthetic
- Consider accessibility and best practices when implementing styles

When provided with canvas wireframes:
- Analyze the layout structure, element positioning, and spatial relationships
- Understand the relative sizes and proportions of components
- Maintain the wireframe's information architecture
- Convert wireframe elements into polished UI components

Generate clean, well-structured HTML code that can be directly rendered in a browser. Focus on creating visually appealing, functional user interfaces.`;

    // Build user message parts
    const userParts: any[] = [];

    // Add system instruction as the first part of the user message (for compatibility with both providers)
    userParts.push({
      text: systemInstruction
    });

    // Add main prompt
    userParts.push({
      text: `Generate Tailwind CSS UI code based on this description: "${prompt}". `
    });

    // Add canvas as reference if requested
    if (useCanvas && canvasImage) {
      const [dataHeader, imageData] = canvasImage.split(',');
      const mimeType = dataHeader.match(/:(.*?);/)?.[1] || 'image/png';

      userParts.push({
        inlineData: {
          data: imageData,
          mimeType: mimeType
        }
      });

      let canvasInstruction = '';
      if (canvasStrength > 70) {
        canvasInstruction = 'STRICTLY follow this canvas wireframe layout. Analyze exact positioning, relative sizes, and spatial relationships of all elements. Match layout structure precisely.';
      } else if (canvasStrength > 40) {
        canvasInstruction = 'Use this canvas wireframe as a guide for overall layout structure. Maintain general positioning and proportions while allowing reasonable adjustments for better UX.';
      } else {
        canvasInstruction = 'Consider this canvas wireframe as loose inspiration. Focus on capturing general flow and component types, but feel free to restructure for better design.';
      }

      userParts.push({
        text: `${canvasInstruction} `
      });
    }

    // Add reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      for (const refImage of referenceImages) {
        const [dataHeader, imageData] = refImage.split(',');
        const mimeType = dataHeader.match(/:(.*?);/)?.[1] || 'image/png';

        userParts.push({
          inlineData: {
            data: imageData,
            mimeType: mimeType
          }
        });
      }

      let referenceInstruction = '';
      if (referenceStrength > 70) {
        referenceInstruction = `STRICTLY analyze and match these reference images. For each reference image, systematically extract and apply:

1. Color Palette Analysis:
   - Identify primary color (dominant background/surface color) - extract exact hex code
   - Identify secondary color (cards, panels, sections) - extract exact hex code
   - Identify accent colors (buttons, highlights, call-to-action elements) - extract exact hex codes
   - Note any color gradients, overlays, or opacity values
   - Apply these exact colors using Tailwind classes (e.g., bg-[#hex], text-[#hex])

2. Typography System:
   - Identify font family hierarchy (headings vs body text vs UI text)
   - Extract font sizes for each level (h1, h2, h3, body, small)
   - Note font weights (light, regular, medium, bold, semibold)
   - Identify line height values (tight, normal, relaxed, leading-X)
   - Apply using Tailwind classes (e.g., text-xl, font-bold, leading-relaxed)

3. Spacing Patterns:
   - Analyze gap sizes between elements (4px, 8px, 16px, 24px grid?)
   - Extract margin values for containers and sections
   - Identify padding values for cards and components
   - Note spacing ratios (e.g., margin is 2x padding)
   - Apply using Tailwind gap, p-, m- classes

4. Border Radius Values:
   - Identify small radius (buttons, tags, small cards) - exact pixel value
   - Identify medium radius (cards, panels) - exact pixel value
   - Identify large radius (main containers, modals) - exact pixel value
   - Apply using Tailwind rounded-sm, rounded-md, rounded-lg, or custom values

5. Component Styles:
   - Analyze card design (shadows? borders? background?)
   - Study button styles (solid? outline? icon? hover states?)
   - Examine input field styling (floating labels? bordered? background?)
   - Review icon usage style (outlined? filled? size ratios?)
   - Replicate these exact component styles

6. Layout Patterns:
   - Identify grid/flex layout preferences
   - Note alignment patterns (left, center, justified)
   - Analyze responsiveness strategy (mobile vs desktop)
   - Apply these layout patterns consistently

Generate UI that matches these extracted design specifications EXACTLY. Every color, size, spacing value, and style should match the reference images.`;
      } else if (referenceStrength > 40) {
        referenceInstruction = `Analyze these reference images for design guidance. Extract key patterns and apply them thoughtfully:

1. Color Scheme Analysis:
   - Identify the overall color palette (primary, secondary, accent)
   - Note color relationships and harmonies
   - Extract approximate hex codes for key colors
   - Apply a cohesive color scheme inspired by references

2. Typography Choices:
   - Understand the typography hierarchy used
   - Note relative size differences between elements
   - Identify font weights for emphasis
   - Apply similar typography patterns with appropriate contrast

3. Spacing System:
   - Analyze spacing consistency across the UI
   - Note the spacing rhythm and proportions
   - Identify margin/padding relationships
   - Apply similar spacing patterns for consistency

4. Component Styles:
   - Study card designs and visual hierarchy
   - Examine button and interactive element styling
   - Note shadow, border, and background treatments
   - Apply similar component style patterns

Create a cohesive UI that reflects the reference aesthetic while adapting appropriately to your specific content and requirements.`;
      } else {
        referenceInstruction = `Consider these reference images for general design inspiration. Note the overall aesthetic elements:

1. Visual Mood & Style:
   - Observe the overall mood (minimal, playful, professional, etc.)
   - Note the design language (flat, material, glassmorphism, etc.)
   - Consider general aesthetic direction

2. General Patterns:
   - Note any recurring visual motifs or design elements
   - Observe the level of detail vs minimalism
   - Consider accessibility and clarity of the design

3. Feel free to create a fresh, optimal design:
   - Use the references as loose inspiration
   - Prioritize user experience and functionality
   - Apply modern best practices and accessibility
   - Create a design that works best for your specific requirements`;
      }

      userParts.push({
        text: `${referenceInstruction} `
      });
    }

    // Add instructions for output format
    userParts.push({
      text: `Generate only HTML code with Tailwind CSS classes for the specific UI mockup. The UI should be responsive and match the dimensions of ${canvasDimensions.width}x${canvasDimensions.height}px. Do not include <!DOCTYPE html>, <html>, <head>, or <body> tags. Only return the specific UI component or section with appropriate Tailwind classes. Focus on the visual elements and layout without generating full page structure.`
    });

    // Add user message to provider content
    providerContent.push({
      role: 'user',
      parts: userParts
    });

    // Use the provider to generate content
    const result = await aiProvider.generateContent(providerContent, {
      temperature,
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

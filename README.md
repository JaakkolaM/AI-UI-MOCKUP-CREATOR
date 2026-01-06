# AI UI Mockup Creator

A powerful Next.js application for creating UI mockups with AI-powered code generation and vector drawing tools.

## Features

### 🤖 AI-Powered UI Code Generation
- **Generate UI from Description**: Create complete HTML/Tailwind CSS interfaces from text descriptions
- **Canvas Wireframe Analysis**: Upload wireframe sketches and let AI convert them to polished UIs
- **Reference Image Analysis**: Upload existing webpages as style references and match their design patterns
- **Multiple AI Providers**:
  - **Gemini** (Google): Flash and Pro models for different quality/speed needs
  - **OpenRouter/GLM-4.6v**: Best performer with strong reference image adherence
  - **OpenRouter/Qwen 3 VL**: Alternative vision-language model option
- **Strength Controls**:
  - Canvas Layout Strength (0-100%): Control how closely AI follows wireframe layout
  - Reference Style Strength (0-100%): Control how strictly AI matches reference designs
- **Smart Temperature Adjustment**: Automatically optimized based on provider and strength settings
- **Live Preview**: Preview generated UI in new window or embedded in app
- **Code Export**: Export generated HTML code or download as complete HTML file

### ✅ Vector Canvas Editor
- **Shape Tools**: Rectangle (with corner radius), Circle, Ellipse, Line, Bezier curves, Polyline
- **Image Upload**: Add and manipulate images on canvas
- **Advanced Controls**: Shadow effects with opacity, layer ordering (bring to front/send to back)
- **Transformations**: Move, resize, rotate, scale all shapes
- **Styling**: Custom colors, stroke width, fill, opacity
- **Canvas Management**: Adjustable canvas size, background images
- **History**: Full undo/redo support
- **Export**: PNG, SVG, or JSON formats
- **Theme**: Dark/light mode with OKLCH color system

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure API Keys
Create a `.env.local` file in the root directory:

**For Google Gemini:**
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```
Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

**For OpenRouter (recommended for UI generation):**
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_DEFAULT_MODEL=z-ai/glm-4.6v
```
Get your API key from [OpenRouter](https://openrouter.ai/keys)

### 3. Run the development server
```bash
npm run dev
```

### 4. Open the app
Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Drawing Tools
1. Select a tool from the left sidebar
2. Draw shapes on the canvas
3. Select shapes to edit properties in the right panel
4. Use keyboard shortcuts: `Ctrl+Z` (undo), `Ctrl+Y` (redo), `Del` (delete), `Esc` (deselect)

### AI UI Generation
1. **Describe Your UI**: Enter a detailed description of the interface you want to create
2. **Add Canvas Reference** (optional): 
   - Draw a wireframe sketch on the canvas
   - Toggle "Use canvas as reference"
   - Set "Canvas Layout Strength" slider (0-100%)
3. **Add Reference Images** (optional):
   - Upload screenshots or images of existing webpages
   - Set "Reference Style Strength" slider (0-100%)
4. **Choose AI Provider**:
   - **Gemini**: Good for general UI generation
   - **OpenRouter/GLM-4.6v**: Best for reference image adherence (recommended)
   - **OpenRouter/Qwen 3 VL**: Alternative vision model
5. **Click "Generate UI"**: AI will create code based on your inputs
6. **Preview & Export**: 
   - Click "Preview" to see the generated UI
   - Click "Export Code" to download the HTML file
   - Copy code to clipboard for further editing

## AI Generation Tips

### For Better Wireframe Following:
- Set **Canvas Layout Strength** to 70-100% for strict adherence
- Use clear shapes with proper spacing in your wireframe
- Label important elements with text on the canvas

### For Better Reference Matching:
- Set **Reference Style Strength** to 70-100% for exact style matching
- Upload high-quality screenshots or design mockups
- Use images with clear color palettes and typography

### For More Creative Results:
- Set both strength sliders to 20-40%
- Provide detailed descriptions of desired features
- Let AI suggest optimal design patterns

### Provider Recommendations:
- **GLM-4.6v (OpenRouter)**: Best overall performer, excellent reference adherence
- **Gemini**: Good for simple UIs, may struggle with complex references
- **Qwen 3 VL**: Can be less stable, try GLM-4.6v first

## Tech Stack

- **Framework**: Next.js 15+ with App Router & TypeScript
- **AI Providers**: Google Gemini, OpenRouter (GLM-4.6v, Qwen 3 VL)
- **Canvas**: Fabric.js for vector graphics
- **State Management**: Zustand
- **Styling**: Tailwind CSS with OKLCH colors
- **Icons**: Lucide React
- **File Upload**: React Dropzone

## Project Structure

```
├── app/
│   ├── globals.css       # Global styles & theme
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── api/
│       ├── generate-ui/   # UI generation endpoint
│       └── generate/      # Image generation endpoint
├── components/
│   └── canvas/
│       ├── ai-generation.tsx      # AI generation controls
│       ├── canvas-controls.tsx    # Canvas controls
│       ├── drawing-tools.tsx      # Drawing tools sidebar
│       ├── export-controls.tsx    # Export functionality
│       ├── fabric-canvas.tsx      # Main canvas component
│       └── shape-properties.tsx   # Shape properties panel
│   └── canvas-app.tsx           # Main app component
├── lib/
│   ├── store/
│   │   └── canvas-store.ts        # Zustand store
│   ├── canvas-export.ts           # Export utilities
│   ├── types.ts                  # TypeScript types
│   ├── aiProvider.ts             # AI provider interface
│   ├── providerFactory.ts         # Provider factory
│   └── providers/
│       ├── geminiProvider.ts      # Gemini implementation
│       └── openRouterProvider.ts  # OpenRouter implementation
└── public                      # Static assets
```

## AI Provider Pricing

### Google Gemini
- ✅ **FREE** tier available
  - 15 requests per minute
  - 1,500 requests per day
- 💰 **Paid tier** available
  - Check [ai.google.dev/pricing](https://ai.google.dev/pricing)

### OpenRouter
- 💰 **Pay-per-use** pricing
  - GLM-4.6v: Very competitive pricing
  - Check [openrouter.ai/models](https://openrouter.ai/models)
  - No free tier, but affordable for most use cases

## License

MIT License - see LICENSE file for details

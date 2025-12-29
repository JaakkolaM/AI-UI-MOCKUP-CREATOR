# AI UI Mockup Creator

A Next.js application for creating UI mockups with vector drawing tools and AI image generation powered by Gemini.

## Features

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

### ✅ AI Image Generation (Powered by Google Gemini)
- **Text-to-Image**: Generate images from text prompts using Gemini's image models
- **Sketch-to-Image**: Use canvas drawings as reference for AI generation
- **Smart Canvas Analysis**: Gemini vision analyzes your sketches to enhance generation
- **Quality Modes**:
  - **Preview**: Fast generation using Gemini 2.5 Flash Image ("Nano Banana")
  - **Final**: 4K high-quality using Gemini 3 Pro Image ("Nano Banana Pro")
- **Flexible Integration**: Add generated images directly to canvas
- **Simple Setup**: Just one API key from Google AI Studio (FREE tier available!)

**Powered by:**
- 🎨 **Nano Banana** (Gemini 2.5 Flash Image) - Fast, low latency
- 🎨 **Nano Banana Pro** (Gemini 3 Pro Image) - 4K resolution, high fidelity

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up API Key

Create a `.env.local` file in the root directory:

```env
# Google Gemini API Key (REQUIRED)
# Get it from: https://aistudio.google.com/app/apikey
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your API key:**

#### Google Gemini API Key (FREE):
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "**Get API Key**" or "**Create API Key**"
3. Copy your API key (starts with `AIza...`)
4. Paste it as `GOOGLE_GEMINI_API_KEY` in `.env.local`

That's it! Just one API key needed. 🎉

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

### AI Generation
1. Click **"AI Generate"** button in the header
2. Enter a text prompt describing your desired image
3. Optionally check **"Use canvas as reference"** to incorporate your drawing
4. Choose quality: **Preview** (fast) or **Final** (high quality)
5. Click **"Generate Image"**
6. Add the result to your canvas or download it

## Tech Stack

- **Framework**: Next.js 15+ with App Router & TypeScript
- **Canvas**: Fabric.js for vector graphics
- **State Management**: Zustand
- **Styling**: Tailwind CSS with OKLCH colors
- **AI Image Generation**: Google Gemini API - Nano Banana models (via AI Studio)
- **Icons**: Lucide React
- **File Upload**: React Dropzone

## Project Structure

```
├── app/
│   ├── api/generate/     # AI generation API route
│   ├── globals.css       # Global styles & theme
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── canvas/
│   │   ├── ai-generation.tsx      # AI generation panel
│   │   ├── canvas-controls.tsx    # Canvas controls
│   │   ├── drawing-tools.tsx      # Drawing tools sidebar
│   │   ├── export-controls.tsx    # Export functionality
│   │   ├── fabric-canvas.tsx      # Main canvas component
│   │   └── shape-properties.tsx   # Shape properties panel
│   └── canvas-app.tsx    # Main app component
├── lib/
│   ├── store/
│   │   └── canvas-store.ts    # Zustand store
│   ├── canvas-export.ts       # Export utilities
│   └── types.ts               # TypeScript types
└── .env.local            # Environment variables (create this)


# AI UI Mockup Creator

A Next.js application for creating UI mockups with vector drawing tools.

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

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```

### 3. Open the app
Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Drawing Tools
1. Select a tool from the left sidebar
2. Draw shapes on the canvas
3. Select shapes to edit properties in the right panel
4. Use keyboard shortcuts: `Ctrl+Z` (undo), `Ctrl+Y` (redo), `Del` (delete), `Esc` (deselect)

## Tech Stack

- **Framework**: Next.js 15+ with App Router & TypeScript
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
│   └── page.tsx          # Home page
├── components/
│   ├── canvas/
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
└── public                # Static assets
```


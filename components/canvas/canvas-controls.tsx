'use client';

import { useCanvasStore } from '@/lib/store/canvas-store';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Download,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  ASPECT_RATIOS,
  RESOLUTION_LONG_EDGE,
  type AspectRatio,
  type ResolutionLongEdge,
  computeTargetFromLongEdge,
  findMatchingPreset,
} from '@/lib/sizing';

export function CanvasControls() {
  const dimensions = useCanvasStore((state) => state.dimensions);
  const setDimensions = useCanvasStore((state) => state.setDimensions);
  const backgroundImage = useCanvasStore((state) => state.backgroundImage);
  const setBackgroundImage = useCanvasStore((state) => state.setBackgroundImage);
  const updateBackgroundOpacity = useCanvasStore((state) => state.updateBackgroundOpacity);
  const clearShapes = useCanvasStore((state) => state.clearShapes);
  const canvasRef = useCanvasStore((state) => state.canvasRef);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.canUndo());
  const canRedo = useCanvasStore((state) => state.canRedo());
  const shapes = useCanvasStore((state) => state.shapes);
  const [canvasSizeMode, setCanvasSizeMode] = useState<'preset' | 'custom'>(() => {
    const match = findMatchingPreset(dimensions.width, dimensions.height);
    return match ? 'preset' : 'custom';
  });
  const [presetLongEdge, setPresetLongEdge] = useState<ResolutionLongEdge>(() => {
    const match = findMatchingPreset(dimensions.width, dimensions.height);
    return match?.longEdge ?? 1024;
  });
  const [presetAspect, setPresetAspect] = useState<AspectRatio>(() => {
    const match = findMatchingPreset(dimensions.width, dimensions.height);
    return match?.aspect ?? '4:3';
  });
  
  // Keep preset selectors in sync when user is using presets.
  useEffect(() => {
    if (canvasSizeMode !== 'preset') return;
    const match = findMatchingPreset(dimensions.width, dimensions.height);
    if (match) {
      setPresetLongEdge(match.longEdge);
      setPresetAspect(match.aspect);
    }
  }, [canvasSizeMode, dimensions.width, dimensions.height]);
  
  // Handle background image upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setBackgroundImage({
            url,
            width: img.width,
            height: img.height,
            opacity: 0.5,
          });
        };
        img.src = url;
      };
      
      reader.readAsDataURL(file);
    }
  }, [setBackgroundImage]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
  });

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const exportPng = () => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
    downloadDataUrl(dataUrl, `ai-renderer-${Date.now()}.png`);
  };

  const exportJpg = () => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: 1 });
    downloadDataUrl(dataUrl, `ai-renderer-${Date.now()}.jpg`);
  };
  
  return (
    <div className="bg-card border-t-2 border-border p-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Canvas Size */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Canvas Size:</label>
          <select
            value={canvasSizeMode}
            onChange={(e) => {
              const mode = e.target.value as 'preset' | 'custom';
              setCanvasSizeMode(mode);
              if (mode === 'preset') {
                const target = computeTargetFromLongEdge(presetLongEdge, presetAspect);
                setDimensions(target);
              }
            }}
            className="px-3 py-1.5 border border-border rounded text-sm bg-background text-foreground"
            title="Choose preset sizing or custom size"
          >
            <option value="preset">Preset</option>
            <option value="custom">Custom</option>
          </select>

          {canvasSizeMode === 'preset' ? (
            <>
              <select
                value={presetLongEdge}
                onChange={(e) => {
                  const longEdge = Number(e.target.value) as ResolutionLongEdge;
                  setPresetLongEdge(longEdge);
                  const target = computeTargetFromLongEdge(longEdge, presetAspect);
                  setDimensions(target);
                }}
                className="px-3 py-1.5 border border-border rounded text-sm bg-background text-foreground"
                title="Resolution (long edge)"
              >
                {RESOLUTION_LONG_EDGE.map((r) => (
                  <option key={r} value={r}>
                    {r === 1024 ? '1K' : r === 2048 ? '2K' : '4K'}
                  </option>
                ))}
              </select>

              <select
                value={presetAspect}
                onChange={(e) => {
                  const aspect = e.target.value as AspectRatio;
                  setPresetAspect(aspect);
                  const target = computeTargetFromLongEdge(presetLongEdge, aspect);
                  setDimensions(target);
                }}
                className="px-3 py-1.5 border border-border rounded text-sm bg-background text-foreground"
                title="Aspect ratio"
              >
                {ASPECT_RATIOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <span className="text-muted-foreground text-sm">
                {dimensions.width}×{dimensions.height}
              </span>
            </>
          ) : (
            <>
              {/* Custom Size Inputs */}
              <input
                type="number"
                min={1}
                value={dimensions.width}
                onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                className="w-24 px-2 py-1.5 border border-border rounded text-sm bg-background text-foreground"
                placeholder="Width"
              />
              <span className="text-muted-foreground">×</span>
              <input
                type="number"
                min={1}
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                className="w-24 px-2 py-1.5 border border-border rounded text-sm bg-background text-foreground"
                placeholder="Height"
              />
            </>
          )}
        </div>
        
        {/* Divider */}
        <div className="h-8 w-px bg-border" />
        
        {/* Background Image Upload */}
        <div className="flex items-center gap-2">
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <button
              className={`
                px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2
                ${isDragActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                }
              `}
            >
              <Upload size={16} />
              Upload Background
            </button>
          </div>
          
          {backgroundImage && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-foreground">Opacity:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={backgroundImage.opacity}
                  onChange={(e) => updateBackgroundOpacity(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">
                  {Math.round(backgroundImage.opacity * 100)}%
                </span>
              </div>
              <button
                onClick={() => setBackgroundImage(null)}
                className="p-1.5 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded"
                title="Remove background"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
        
        {/* Divider */}
        <div className="h-8 w-px bg-border" />
        
        {/* History Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium flex items-center gap-1 text-secondary-foreground"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium flex items-center gap-1 text-secondary-foreground"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
            Redo
          </button>
        </div>
        
        {/* Divider */}
        <div className="h-8 w-px bg-border" />
        
        {/* Clear All */}
        <button
          onClick={() => {
            if (confirm('Clear all shapes? This cannot be undone.')) {
              clearShapes();
            }
          }}
          className="px-3 py-1.5 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded text-sm font-medium flex items-center gap-1"
        >
          <Trash2 size={16} />
          Clear All
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportPng}
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded text-sm font-medium flex items-center gap-1 text-secondary-foreground"
            title="Save PNG"
          >
            <Download size={16} />
            Save PNG
          </button>
          <button
            onClick={exportJpg}
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded text-sm font-medium flex items-center gap-1 text-secondary-foreground"
            title="Save JPG"
          >
            <Download size={16} />
            Save JPG
          </button>
        </div>
        
        {/* Shape Count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {shapes.length} shape{shapes.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useCanvasStore } from '@/lib/store/canvas-store';
import { Tool } from '@/lib/types';
import { 
  MousePointer2, 
  Type,
  Square, 
  Circle, 
  Minus, 
  Spline,
  Pentagon,
  Image as ImageIcon,
  Trash2,
  Pipette
} from 'lucide-react';
import { useState, useRef } from 'react';

export function DrawingTools() {
  const currentTool = useCanvasStore((state) => state.currentTool);
  const setTool = useCanvasStore((state) => state.setTool);
  const setPendingImage = useCanvasStore((state) => state.setPendingImage);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const drawingSettings = useCanvasStore((state) => state.drawingSettings);
  const setStrokeColor = useCanvasStore((state) => state.setStrokeColor);
  const setFillColor = useCanvasStore((state) => state.setFillColor);
  const setStrokeWidth = useCanvasStore((state) => state.setStrokeWidth);
  const setCornerRadius = useCanvasStore((state) => state.setCornerRadius);
  const setFillEnabled = useCanvasStore((state) => state.setFillEnabled);
  
  const [showAdvanced, setShowAdvanced] = useState(true);
  
  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'bezier', icon: Spline, label: 'Bezier' },
    { id: 'polyline', icon: Pentagon, label: 'Polyline' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'delete', icon: Trash2, label: 'Delete' },
  ];
  
  return (
    <div className="w-20 bg-muted border-r-2 border-border flex flex-col p-2 gap-2">
      {/* Tool Buttons */}
      <div className="flex flex-col gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setTool(tool.id)}
              className={`
                p-3 rounded-lg flex flex-col items-center justify-center gap-1
                transition-colors
                ${currentTool === tool.id 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-card text-card-foreground hover:bg-accent'
                }
              `}
              title={tool.label}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{tool.label}</span>
            </button>
          );
        })}
      </div>
      
      
      {/* Divider */}
      <div className="border-t border-gray-300 my-2" />
      
      {/* Bezier Tool Help */}
      {currentTool === 'bezier' && (
        <div className="p-2 bg-accent border border-border rounded text-[9px] text-accent-foreground leading-tight">
          <p className="font-bold mb-1">Bezier:</p>
          <p>Click to add points</p>
          <p className="text-[8px] text-muted-foreground">(Need 3+ points)</p>
          <p className="mt-1">Press Enter to finish</p>
        </div>
      )}
      
      {/* Polyline Tool Help */}
      {currentTool === 'polyline' && (
        <div className="p-2 bg-accent border border-border rounded text-[9px] text-accent-foreground leading-tight">
          <p className="font-bold mb-1">Polyline:</p>
          <p>Click to add points</p>
          <p className="text-[8px] text-muted-foreground">(Straight lines)</p>
          <p className="mt-1">Click near start to close</p>
          <p className="mt-1">Press Enter to finish</p>
        </div>
      )}
      
      {/* Image Tool Help & Upload */}
      {currentTool === 'image' && (
        <div className="flex flex-col gap-2">
          <div className="p-2 bg-accent border border-border rounded text-[9px] text-accent-foreground leading-tight">
            <p className="font-bold mb-1">Image:</p>
            <p>Upload an image</p>
            <p className="mt-1">Then click to place</p>
          </div>
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const url = event.target?.result as string;
                  setPendingImage(url);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          
          <button
            onClick={() => imageInputRef.current?.click()}
            className="w-full px-2 py-2 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90"
          >
            Upload Image
          </button>
        </div>
      )}
      
      {/* Drawing Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="p-2 bg-card rounded-lg text-xs font-medium hover:bg-accent"
      >
        {showAdvanced ? 'Hide' : 'Show'} Settings
      </button>
      
      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="fixed left-24 top-24 bg-card border-2 border-border rounded-lg shadow-lg p-4 w-64 z-50">
          <h3 className="font-bold text-sm mb-3 text-card-foreground">Drawing Settings</h3>
          
          {/* Stroke Color */}
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1 text-card-foreground">Stroke Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={drawingSettings.strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-12 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={drawingSettings.strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
              />
            </div>
          </div>
          
          {/* Fill Color */}
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1 flex items-center justify-between text-card-foreground">
              <span>Fill Color</span>
              <input
                type="checkbox"
                checked={drawingSettings.fillEnabled}
                onChange={(e) => setFillEnabled(e.target.checked)}
                className="cursor-pointer"
              />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={drawingSettings.fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                disabled={!drawingSettings.fillEnabled}
                className="w-12 h-8 rounded cursor-pointer disabled:opacity-50"
              />
              <input
                type="text"
                value={drawingSettings.fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                disabled={!drawingSettings.fillEnabled}
                className="flex-1 px-2 py-1 text-xs border border-border rounded disabled:opacity-50 bg-background text-foreground"
              />
            </div>
          </div>
          
          {/* Stroke Width */}
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1 text-card-foreground">
              Stroke Width: {drawingSettings.strokeWidth}px {drawingSettings.strokeWidth === 0 && '(No stroke)'}
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={drawingSettings.strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Corner Radius (for rectangles) */}
          {currentTool === 'rectangle' && (
            <div className="mb-3">
              <label className="text-xs font-medium block mb-1 text-card-foreground">
                Corner Radius: {drawingSettings.cornerRadius}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={drawingSettings.cornerRadius}
                onChange={(e) => setCornerRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={() => setShowAdvanced(false)}
            className="w-full mt-2 px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-xs font-medium text-secondary-foreground"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}


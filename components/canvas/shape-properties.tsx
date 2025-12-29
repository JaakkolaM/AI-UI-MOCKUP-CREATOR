'use client';

import { useCanvasStore } from '@/lib/store/canvas-store';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function to2Hex(n: number) {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${to2Hex(r)}${to2Hex(g)}${to2Hex(b)}`;
}

function parseHexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]+$/.test(raw)) return null;
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  if (raw.length === 6 || raw.length === 8) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function parseRgbLike(input: string): { r: number; g: number; b: number } | null {
  const m = input
    .trim()
    .match(/^rgba?\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)(?:\s*,\s*([0-9.]+))?\s*\)$/i);
  if (!m) return null;

  const parseChannel = (v: string) => {
    if (v.endsWith('%')) return clamp((parseFloat(v) / 100) * 255, 0, 255);
    return clamp(parseFloat(v), 0, 255);
  };

  return {
    r: parseChannel(m[1]),
    g: parseChannel(m[2]),
    b: parseChannel(m[3]),
  };
}

function parseRgbaAlpha(input: string): number | null {
  const m = input
    .trim()
    .match(/^rgba\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+)\s*\)$/i);
  if (!m) return null;
  const a = parseFloat(m[4]);
  if (Number.isNaN(a)) return null;
  return clamp(a, 0, 1);
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  // h: [0..360), s/l: [0..1]
  const hh = ((h % 360) + 360) % 360 / 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh * 6) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  const seg = hh * 6;
  if (seg >= 0 && seg < 1) [r1, g1, b1] = [c, x, 0];
  else if (seg >= 1 && seg < 2) [r1, g1, b1] = [x, c, 0];
  else if (seg >= 2 && seg < 3) [r1, g1, b1] = [0, c, x];
  else if (seg >= 3 && seg < 4) [r1, g1, b1] = [0, x, c];
  else if (seg >= 4 && seg < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

function parseHslLike(input: string): { r: number; g: number; b: number } | null {
  const m = input
    .trim()
    .match(/^hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%(?:\s*,\s*([0-9.]+))?\s*\)$/i);
  if (!m) return null;
  const h = parseFloat(m[1]);
  const s = clamp(parseFloat(m[2]) / 100, 0, 1);
  const l = clamp(parseFloat(m[3]) / 100, 0, 1);
  return hslToRgb(h, s, l);
}

function parseHslaAlpha(input: string): number | null {
  const m = input
    .trim()
    .match(/^hsla\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)\s*\)$/i);
  if (!m) return null;
  const a = parseFloat(m[4]);
  if (Number.isNaN(a)) return null;
  return clamp(a, 0, 1);
}

function cssColorToHexForColorInput(input: string | undefined | null, fallbackHex: string) {
  const raw = (input ?? '').trim();
  if (!raw) return fallbackHex;
  if (raw.toLowerCase() === 'transparent') return fallbackHex;

  // Hex
  if (raw.startsWith('#')) {
    const rgb = parseHexToRgb(raw);
    return rgb ? rgbToHex(rgb.r, rgb.g, rgb.b) : fallbackHex;
  }

  // rgb()/rgba()
  const rgb = parseRgbLike(raw);
  if (rgb) return rgbToHex(rgb.r, rgb.g, rgb.b);

  // hsl()/hsla()
  const hsl = parseHslLike(raw);
  if (hsl) return rgbToHex(hsl.r, hsl.g, hsl.b);

  return fallbackHex;
}

function cssColorToRgbaForAlphaControl(
  input: string | undefined | null,
  fallbackHex: string
): { r: number; g: number; b: number; a: number } {
  const raw = (input ?? '').trim();
  if (!raw) {
    const rgb = parseHexToRgb(fallbackHex) ?? { r: 0, g: 0, b: 0 };
    return { ...rgb, a: 1 };
  }
  if (raw.toLowerCase() === 'transparent') {
    const rgb = parseHexToRgb(fallbackHex) ?? { r: 0, g: 0, b: 0 };
    return { ...rgb, a: 0 };
  }

  // Hex (#RGB/#RRGGBB/#RRGGBBAA)
  if (raw.startsWith('#')) {
    const rgb = parseHexToRgb(raw);
    if (rgb) {
      // If #RRGGBBAA, interpret AA as alpha
      const cleaned = raw.trim().replace(/^#/, '');
      if (cleaned.length === 8) {
        const aa = parseInt(cleaned.slice(6, 8), 16);
        return { ...rgb, a: clamp(aa / 255, 0, 1) };
      }
      return { ...rgb, a: 1 };
    }
  }

  // rgb()/rgba()
  const rgb = parseRgbLike(raw);
  if (rgb) {
    const a = parseRgbaAlpha(raw) ?? 1;
    return { ...rgb, a };
  }

  // hsl()/hsla()
  const hsl = parseHslLike(raw);
  if (hsl) {
    const a = parseHslaAlpha(raw) ?? 1;
    return { r: hsl.r, g: hsl.g, b: hsl.b, a };
  }

  // Fallback to hex fallback color, opaque
  const fb = parseHexToRgb(fallbackHex) ?? { r: 0, g: 0, b: 0 };
  return { ...fb, a: 1 };
}

export function ShapeProperties() {
  const shapes = useCanvasStore((state) => state.shapes);
  const selectedShapeId = useCanvasStore((state) => state.selectedShapeId);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const deleteShape = useCanvasStore((state) => state.deleteShape);
  const bringToFront = useCanvasStore((state) => state.bringToFront);
  const sendToBack = useCanvasStore((state) => state.sendToBack);
  
  const selectedShape = shapes.find((s) => s.id === selectedShapeId);
  
  if (!selectedShape) {
    return (
      <div className="w-64 bg-muted border-l-2 border-border p-4">
        <div className="text-center text-muted-foreground text-sm mt-8">
          <p>No shape selected</p>
          <p className="text-xs mt-2">Select a shape to edit its properties</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-64 bg-muted border-l-2 border-border p-4 overflow-y-auto">
      <h3 className="font-bold text-lg mb-4 text-foreground">Shape Properties</h3>
      
      {/* Shape Type */}
      <div className="mb-4 p-2 bg-accent rounded">
        <p className="text-xs font-medium text-accent-foreground uppercase">
          {selectedShape.type}
        </p>
      </div>

      {/* Text properties */}
      {selectedShape.type === 'text' && (
        <>
          <div className="mb-4">
            <label className="text-xs font-medium block mb-2 text-foreground">Text</label>
            <textarea
              value={(selectedShape as any).text ?? ''}
              onChange={(e) => updateShape(selectedShape.id, { text: e.target.value } as any)}
              className="w-full min-h-20 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              placeholder="Enter text..."
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Tip: double-click text on canvas to edit directly.
            </p>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium block mb-2 text-foreground">Wrap Width</label>
            <input
              type="number"
              min={20}
              value={Math.round((selectedShape as any).width ?? 260)}
              onChange={(e) => updateShape(selectedShape.id, { width: Number(e.target.value) } as any)}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium block mb-2 text-foreground">
              Font Size: {Math.round((selectedShape as any).fontSize ?? 32)}px
            </label>
            <input
              type="range"
              min="8"
              max="200"
              value={(selectedShape as any).fontSize ?? 32}
              onChange={(e) => updateShape(selectedShape.id, { fontSize: Number(e.target.value) } as any)}
              className="w-full"
            />
            <input
              type="number"
              min={1}
              value={Math.round((selectedShape as any).fontSize ?? 32)}
              onChange={(e) => updateShape(selectedShape.id, { fontSize: Number(e.target.value) } as any)}
              className="w-full mt-2 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium block mb-2 text-foreground">Font Family</label>
            <input
              type="text"
              value={(selectedShape as any).fontFamily ?? 'Arial'}
              onChange={(e) => updateShape(selectedShape.id, { fontFamily: e.target.value } as any)}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              placeholder="Arial"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium block mb-2 text-foreground">Alignment</label>
            <select
              value={(selectedShape as any).textAlign ?? 'left'}
              onChange={(e) => updateShape(selectedShape.id, { textAlign: e.target.value } as any)}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        </>
      )}
      
      {/* Position */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">Position</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">X</label>
            <input
              type="number"
              value={Math.round(selectedShape.x)}
              onChange={(e) => updateShape(selectedShape.id, { x: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Y</label>
            <input
              type="number"
              value={Math.round(selectedShape.y)}
              onChange={(e) => updateShape(selectedShape.id, { y: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
            />
          </div>
        </div>
      </div>
      
      {/* Dimensions */}
      {selectedShape.type === 'rectangle' && (
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2 text-foreground">Size</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Width</label>
              <input
                type="number"
                value={Math.round(selectedShape.width)}
                onChange={(e) => updateShape(selectedShape.id, { width: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Height</label>
              <input
                type="number"
                value={Math.round(selectedShape.height)}
                onChange={(e) => updateShape(selectedShape.id, { height: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              />
            </div>
          </div>
        </div>
      )}
      
      {selectedShape.type === 'circle' && (
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2 text-foreground">Radius</label>
          <input
            type="number"
            value={Math.round(selectedShape.radius)}
            onChange={(e) => updateShape(selectedShape.id, { radius: Number(e.target.value) })}
            className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
          />
        </div>
      )}
      
      {selectedShape.type === 'ellipse' && (
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2 text-foreground">Radii</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Radius X</label>
              <input
                type="number"
                value={Math.round(selectedShape.radiusX)}
                onChange={(e) => updateShape(selectedShape.id, { radiusX: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Radius Y</label>
              <input
                type="number"
                value={Math.round(selectedShape.radiusY)}
                onChange={(e) => updateShape(selectedShape.id, { radiusY: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Rotation */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Rotation: {Math.round(selectedShape.rotation)}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          value={selectedShape.rotation}
          onChange={(e) => updateShape(selectedShape.id, { rotation: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      
      {/* Colors */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          {selectedShape.type === 'text' ? 'Outline Color' : 'Stroke Color'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={cssColorToHexForColorInput(selectedShape.strokeColor, '#000000')}
            onChange={(e) => updateShape(selectedShape.id, { strokeColor: e.target.value })}
            className="w-12 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={selectedShape.strokeColor}
            onChange={(e) => updateShape(selectedShape.id, { strokeColor: e.target.value })}
            className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
          />
        </div>
        <div className="mt-2">
          {(() => {
            const rgba = cssColorToRgbaForAlphaControl(selectedShape.strokeColor, '#000000');
            return (
              <>
                <label className="text-xs text-muted-foreground block mb-1">
                  Alpha: {Math.round(rgba.a * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={rgba.a}
                  onChange={(e) => {
                    const a = clamp(Number(e.target.value), 0, 1);
                    updateShape(selectedShape.id, {
                      strokeColor: `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${a})`,
                    });
                  }}
                  className="w-full"
                />
              </>
            );
          })()}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          {selectedShape.type === 'text' ? 'Text Color' : 'Fill Color'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={cssColorToHexForColorInput(selectedShape.fillColor, '#ffffff')}
            onChange={(e) => updateShape(selectedShape.id, { fillColor: e.target.value })}
            className="w-12 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={selectedShape.fillColor}
            onChange={(e) => updateShape(selectedShape.id, { fillColor: e.target.value })}
            className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
            placeholder="transparent"
          />
        </div>
        <div className="mt-2">
          {(() => {
            const rgba = cssColorToRgbaForAlphaControl(selectedShape.fillColor, '#ffffff');
            return (
              <>
                <label className="text-xs text-muted-foreground block mb-1">
                  Alpha: {Math.round(rgba.a * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={rgba.a}
                  onChange={(e) => {
                    const a = clamp(Number(e.target.value), 0, 1);
                    updateShape(selectedShape.id, {
                      fillColor: `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${a})`,
                    });
                  }}
                  className="w-full"
                />
              </>
            );
          })()}
        </div>
      </div>
      
      {/* Stroke Width */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Stroke Width: {selectedShape.strokeWidth}px {selectedShape.strokeWidth === 0 && '(No stroke)'}
        </label>
        <input
          type="range"
          min="0"
          max="20"
          value={selectedShape.strokeWidth}
          onChange={(e) => updateShape(selectedShape.id, { strokeWidth: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      
      {/* Corner Radius (for rectangles) */}
      {selectedShape.type === 'rectangle' && (
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2 text-foreground">
            Corner Radius: {selectedShape.cornerRadius}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedShape.cornerRadius}
            onChange={(e) => updateShape(selectedShape.id, { cornerRadius: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      )}
      
      {/* Opacity */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Opacity: {Math.round(selectedShape.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={selectedShape.opacity}
          onChange={(e) => updateShape(selectedShape.id, { opacity: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      
      {/* Shadow */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 flex items-center justify-between text-foreground">
          <span>Shadow</span>
          <input
            type="checkbox"
            checked={selectedShape.shadow?.enabled || false}
            onChange={(e) => updateShape(selectedShape.id, { 
              shadow: { 
                color: selectedShape.shadow?.color || '#000000',
                blur: selectedShape.shadow?.blur || 10,
                offsetX: selectedShape.shadow?.offsetX || 5,
                offsetY: selectedShape.shadow?.offsetY || 5,
                opacity: selectedShape.shadow?.opacity || 0.5,
                enabled: e.target.checked 
              } 
            })}
            className="cursor-pointer"
          />
        </label>
        
        {selectedShape.shadow?.enabled && (
          <div className="space-y-2 mt-2">
            <div>
              <label className="text-xs text-muted-foreground">Shadow Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedShape.shadow.color}
                  onChange={(e) => updateShape(selectedShape.id, { 
                    shadow: { ...selectedShape.shadow!, color: e.target.value } 
                  })}
                  className="w-12 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedShape.shadow.color}
                  onChange={(e) => updateShape(selectedShape.id, { 
                    shadow: { ...selectedShape.shadow!, color: e.target.value } 
                  })}
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">
                Opacity: {Math.round((selectedShape.shadow.opacity || 1) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedShape.shadow.opacity || 1}
                onChange={(e) => updateShape(selectedShape.id, { 
                  shadow: { ...selectedShape.shadow!, opacity: Number(e.target.value) } 
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">
                Blur: {selectedShape.shadow.blur}px
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={selectedShape.shadow.blur}
                onChange={(e) => updateShape(selectedShape.id, { 
                  shadow: { ...selectedShape.shadow!, blur: Number(e.target.value) } 
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">
                Offset X: {selectedShape.shadow.offsetX}px
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                value={selectedShape.shadow.offsetX}
                onChange={(e) => updateShape(selectedShape.id, { 
                  shadow: { ...selectedShape.shadow!, offsetX: Number(e.target.value) } 
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">
                Offset Y: {selectedShape.shadow.offsetY}px
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                value={selectedShape.shadow.offsetY}
                onChange={(e) => updateShape(selectedShape.id, { 
                  shadow: { ...selectedShape.shadow!, offsetY: Number(e.target.value) } 
                })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Layer Actions */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">Layer Order</label>
        <div className="flex gap-2">
          <button
            onClick={() => bringToFront(selectedShape.id)}
            className="flex-1 px-3 py-2 bg-card hover:bg-accent border border-border rounded text-xs font-medium flex items-center justify-center gap-1 text-card-foreground"
          >
            <ArrowUp size={14} />
            Bring to Front
          </button>
          <button
            onClick={() => sendToBack(selectedShape.id)}
            className="flex-1 px-3 py-2 bg-card hover:bg-accent border border-border rounded text-xs font-medium flex items-center justify-center gap-1 text-card-foreground"
          >
            <ArrowDown size={14} />
            Send to Back
          </button>
        </div>
      </div>
      
      {/* Delete Button */}
      <button
        onClick={() => deleteShape(selectedShape.id)}
        className="w-full px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded font-medium flex items-center justify-center gap-2"
      >
        <Trash2 size={16} />
        Delete Shape
      </button>
    </div>
  );
}


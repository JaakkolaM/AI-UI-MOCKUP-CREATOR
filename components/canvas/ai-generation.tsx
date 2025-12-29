'use client';

import { useMemo, useState, useCallback } from 'react';
import { Wand2, Loader2, Download, Image as ImageIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { lightingPresets } from '@/lib/presets';
import {
  ASPECT_RATIOS,
  RESOLUTION_LONG_EDGE,
  type AspectRatio,
  type ResolutionLongEdge,
  computeTargetFromLongEdge,
} from '@/lib/sizing';

export function AIGeneration() {
  const [prompt, setPrompt] = useState('');
  const [useCanvas, setUseCanvas] = useState(false);
  const [quality, setQuality] = useState<'preview' | 'final'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedMeta, setGeneratedMeta] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for product rendering features
  const [selectedPreset, setSelectedPreset] = useState<string>('none');
  type MaterialRef = { id: string; dataUrl: string; weight: number };
  const MAX_MATERIAL_REFS = 8;
  const [materialReferences, setMaterialReferences] = useState<MaterialRef[]>([]);

  const canvasRef = useCanvasStore((state) => state.canvasRef);
  const canvasDimensions = useCanvasStore((state) => state.dimensions);
  const addShape = useCanvasStore((state) => state.addShape);

  // Output sizing
  const [outputMode, setOutputMode] = useState<'canvas' | 'preset'>('canvas');
  const [outputLongEdge, setOutputLongEdge] = useState<ResolutionLongEdge>(2048);
  const [outputAspect, setOutputAspect] = useState<AspectRatio>('1:1');

  const targetSize = useMemo(() => {
    if (outputMode === 'canvas') {
      return { width: canvasDimensions.width, height: canvasDimensions.height };
    }
    return computeTargetFromLongEdge(outputLongEdge, outputAspect);
  }, [outputMode, canvasDimensions.width, canvasDimensions.height, outputLongEdge, outputAspect]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  // Material reference upload handler (multi)
  const onMaterialDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      const availableSlots = Math.max(0, MAX_MATERIAL_REFS - materialReferences.length);
      if (availableSlots <= 0) return;

      const filesToAdd = acceptedFiles.slice(0, availableSlots);
      const dataUrls = await Promise.all(filesToAdd.map(readFileAsDataUrl));

      setMaterialReferences((prev) => [
        ...prev,
        ...dataUrls.map((dataUrl) => ({
          id: `mat-${Date.now()}-${Math.random()}`,
          dataUrl,
          weight: 0.7,
        })),
      ]);
    },
    [materialReferences.length]
  );

  const { getRootProps: getMaterialRootProps, getInputProps: getMaterialInputProps, isDragActive: isMaterialDragActive } = useDropzone({
    onDrop: onMaterialDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  const exportCanvasAsBase64 = (): string | null => {
    const canvas = canvasRef?.current;
    if (!canvas) {
      console.error('Canvas ref not available');
      return null;
    }

    try {
      // Export Fabric.js canvas as PNG data URL
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });
      
      if (!dataURL) {
        console.error('Canvas export returned empty data URL');
        return null;
      }
      
      return dataURL;
    } catch (error) {
      console.error('Failed to export canvas:', error);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedMeta(null);

    try {
      let canvasImage = null;
      if (useCanvas) {
        canvasImage = exportCanvasAsBase64();
        if (!canvasImage) {
          throw new Error('Failed to export canvas');
        }
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          canvasImage,
          useCanvas,
          quality,
          preset: selectedPreset,
          materialReferences: materialReferences.map((m) => ({
            dataUrl: m.dataUrl,
            weight: m.weight,
          })),
          outputMode,
          outputLongEdge: outputMode === 'preset' ? outputLongEdge : undefined,
          outputAspectRatio: outputMode === 'preset' ? outputAspect : undefined,
          outputWidth: outputMode === 'canvas' ? canvasDimensions.width : undefined,
          outputHeight: outputMode === 'canvas' ? canvasDimensions.height : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        if (typeof data.outputWidth === 'number' && typeof data.outputHeight === 'number') {
          setGeneratedMeta({ width: data.outputWidth, height: data.outputHeight });
        }
      } else {
        throw new Error('No image URL received');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCanvas = () => {
    if (!generatedImage) return;

    const id = `shape-${Date.now()}-${Math.random()}`;
    const meta = generatedMeta ?? targetSize;
    const maxOnCanvas = 400;
    const scale = maxOnCanvas / Math.max(meta.width, meta.height);
    const displayWidth = Math.max(1, Math.round(meta.width * scale));
    const displayHeight = Math.max(1, Math.round(meta.height * scale));

    addShape({
      id,
      type: 'image',
      src: generatedImage,
      x: 100,
      y: 100,
      width: displayWidth,
      height: displayHeight,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      strokeColor: '',
      fillColor: '',
      strokeWidth: 0,
      opacity: 1,
    });

    setGeneratedImage(null);
    setGeneratedMeta(null);
  };

  return (
    <div className="w-80 border-l bg-sidebar text-sidebar-foreground p-4 flex flex-col overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Wand2 size={20} />
        AI Generation
      </h2>

      {/* Prompt Input */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm resize-none"
          rows={4}
        />
      </div>

      {/* Lighting Preset Dropdown */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Lighting Preset
        </label>
        <select
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm cursor-pointer"
        >
          {Object.entries(lightingPresets).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.name}
            </option>
          ))}
        </select>
        {selectedPreset !== 'none' && (
          <p className="text-xs text-muted-foreground mt-1">
            {lightingPresets[selectedPreset].description}
          </p>
        )}
      </div>

      {/* Use Canvas Checkbox */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={useCanvas}
            onChange={(e) => setUseCanvas(e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-foreground">Use canvas as reference</span>
        </label>
        {useCanvas && (
          <p className="text-xs text-muted-foreground mt-1">
            The AI will use your canvas sketch as a reference
          </p>
        )}
      </div>

      {/* Material Reference Upload */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Material References (Optional)
        </label>
        
        <div className="space-y-3">
          <div {...getMaterialRootProps()} className="cursor-pointer">
            <input {...getMaterialInputProps()} />
            <div
              className={`
                w-full px-4 py-3 rounded border-2 border-dashed flex items-center justify-center gap-2 text-sm
                ${isMaterialDragActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <ImageIcon size={16} />
              <span>
                {materialReferences.length >= MAX_MATERIAL_REFS
                  ? `Max ${MAX_MATERIAL_REFS} references reached`
                  : `Add material textures (${materialReferences.length}/${MAX_MATERIAL_REFS})`}
              </span>
            </div>
          </div>

          {materialReferences.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {materialReferences.map((m) => (
                  <div key={m.id} className="border border-border rounded overflow-hidden">
                    <div className="relative">
                      <img
                        src={m.dataUrl}
                        alt="Material Reference"
                        className="w-full h-24 object-cover"
                      />
                      <button
                        onClick={() =>
                          setMaterialReferences((prev) => prev.filter((x) => x.id !== m.id))
                        }
                        className="absolute top-1 right-1 p-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded"
                        title="Remove material"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="p-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Intensity</span>
                        <span className="text-foreground">{Math.round(m.weight * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={m.weight}
                        onChange={(e) => {
                          const w = Number(e.target.value);
                          setMaterialReferences((prev) =>
                            prev.map((x) => (x.id === m.id ? { ...x, weight: w } : x))
                          );
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                All references are applied; higher intensity influences materials more strongly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quality Selection */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Quality
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setQuality('preview')}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
              quality === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-accent text-card-foreground border border-border'
            }`}
          >
            Preview (Fast)
          </button>
          <button
            onClick={() => setQuality('final')}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
              quality === 'final'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-accent text-card-foreground border border-border'
            }`}
          >
            Final (HQ)
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {quality === 'preview' 
            ? 'Nano Banana: Fast generation with low latency' 
            : 'Nano Banana Pro: 4K resolution, high fidelity'}
        </p>
      </div>

      {/* Output Size */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Output Size
        </label>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="outputMode"
              checked={outputMode === 'canvas'}
              onChange={() => setOutputMode('canvas')}
              className="cursor-pointer"
            />
            <span className="text-foreground">Use current canvas size</span>
            <span className="text-xs text-muted-foreground">
              ({canvasDimensions.width}×{canvasDimensions.height})
            </span>
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="outputMode"
              checked={outputMode === 'preset'}
              onChange={() => setOutputMode('preset')}
              className="cursor-pointer"
            />
            <span className="text-foreground">Preset</span>
          </label>

          {outputMode === 'preset' && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={outputLongEdge}
                onChange={(e) => setOutputLongEdge(Number(e.target.value) as ResolutionLongEdge)}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm cursor-pointer"
              >
                {RESOLUTION_LONG_EDGE.map((r) => (
                  <option key={r} value={r}>
                    {r === 1024 ? '1K' : r === 2048 ? '2K' : '4K'}
                  </option>
                ))}
              </select>

              <select
                value={outputAspect}
                onChange={(e) => setOutputAspect(e.target.value as AspectRatio)}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm cursor-pointer"
              >
                {ASPECT_RATIOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          Target: {targetSize.width}×{targetSize.height}px
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 size={18} />
            Generate Image
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generated Image Preview */}
      {generatedImage && (
        <div className="space-y-3">
          <div className="border border-border rounded overflow-hidden">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddToCanvas}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm font-medium flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Add to Canvas
            </button>
            <a
              href={generatedImage}
              download="ai-generated-image.png"
              className="flex-1 px-3 py-2 bg-card hover:bg-accent border border-border text-card-foreground rounded text-sm font-medium flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState, useCallback } from 'react';
import { Wand2, Loader2, Download, Image as ImageIcon, X, Code, Eye } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCanvasStore } from '@/lib/store/canvas-store';

export function AIGeneration() {
  const [prompt, setPrompt] = useState('');
  const [useCanvas, setUseCanvas] = useState(false);
  const [model, setModel] = useState<'flash' | 'pro'>('flash');
  const [openRouterModel, setOpenRouterModel] = useState<'glm-4.6v' | 'qwen3-vl'>('glm-4.6v');
  const [provider, setProvider] = useState<'gemini' | 'openrouter'>('gemini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reference image upload
  const [referenceImages, setReferenceImages] = useState<{ id: string; dataUrl: string }[]>([]);
  const MAX_REFERENCE_IMAGES = 5;

  const canvasRef = useCanvasStore((state) => state.canvasRef);
  const canvasDimensions = useCanvasStore((state) => state.dimensions);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  // Reference image upload handler
  const onReferenceDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      const availableSlots = Math.max(0, MAX_REFERENCE_IMAGES - referenceImages.length);
      if (availableSlots <= 0) return;

      const filesToAdd = acceptedFiles.slice(0, availableSlots);
      const dataUrls = await Promise.all(filesToAdd.map(readFileAsDataUrl));

      setReferenceImages((prev) => [
        ...prev,
        ...dataUrls.map((dataUrl) => ({
          id: `ref-${Date.now()}-${Math.random()}`,
          dataUrl,
        })),
      ]);
    },
    [referenceImages.length]
  );

  // Handle clipboard paste
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const availableSlots = Math.max(0, MAX_REFERENCE_IMAGES - referenceImages.length);
      if (availableSlots <= 0) return;

      const images: string[] = [];

      for (let i = 0; i < items.length && images.length < availableSlots; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            try {
              const dataUrl = await readFileAsDataUrl(file);
              images.push(dataUrl);
            } catch (error) {
              console.error('Failed to read pasted image:', error);
            }
          }
        }
      }

      if (images.length > 0) {
        setReferenceImages((prev) => [
          ...prev,
          ...images.map((dataUrl) => ({
            id: `ref-${Date.now()}-${Math.random()}`,
            dataUrl,
          })),
        ]);
      }
    },
    [referenceImages.length]
  );

  const { getRootProps: getReferenceRootProps, getInputProps: getReferenceInputProps, isDragActive: isReferenceDragActive } = useDropzone({
    onDrop: onReferenceDrop,
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
    setGeneratedCode(null);
    setGeneratedPreview(null);

    try {
      let canvasImage = null;
      if (useCanvas) {
        canvasImage = exportCanvasAsBase64();
        if (!canvasImage) {
          throw new Error('Failed to export canvas');
        }
      }

      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          canvasImage,
          useCanvas,
          model,
          openRouterModel,
          referenceImages: referenceImages.map(img => img.dataUrl),
          canvasDimensions,
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate UI');
      }

      if (data.success && data.uiCode) {
        setGeneratedCode(data.uiCode);
        // Create a preview window with the generated UI
        const previewUrl = URL.createObjectURL(new Blob([data.uiCode], { type: 'text/html' }));
        setGeneratedPreview(previewUrl);
      } else if (data.error) {
        throw new Error(data.error || 'Model did not return valid HTML code');
      } else {
        throw new Error('No UI code received');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate UI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCode = () => {
    if (!generatedCode) return;

    // Create a complete HTML document with Tailwind
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated UI</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
  ${generatedCode}
</body>
</html>`.trim();

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-ui.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    if (generatedCode) {
      // Create a complete HTML document with Tailwind
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Generated UI Preview</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100">
          ${generatedCode}
        </body>
        </html>
      `;
      const previewUrl = URL.createObjectURL(new Blob([fullHtml], { type: 'text/html' }));
      window.open(previewUrl, '_blank', `width=${canvasDimensions.width},height=${canvasDimensions.height},resizable=yes,scrollbars=yes`);
    }
  };

  return (
    <div className="w-80 border-l bg-sidebar text-sidebar-foreground p-4 flex flex-col overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Wand2 size={20} />
        Generate UI
      </h2>

      {/* Provider Selection */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          AI Provider
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider('gemini')}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
              provider === 'gemini'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-accent text-card-foreground border border-border'
            }`}
          >
            Gemini
          </button>
          <button
            onClick={() => setProvider('openrouter')}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
              provider === 'openrouter'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-accent text-card-foreground border border-border'
            }`}
          >
            OpenRouter
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {provider === 'gemini'
            ? 'Google Gemini API (requires API key)'
            : 'OpenRouter API with multiple vision models'}
        </p>
      </div>

      {/* Prompt Input */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          UI Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the UI you want to generate..."
          className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm resize-none"
          rows={4}
        />
      </div>

      {/* Model Selection - Only show for Gemini */}
      {provider === 'gemini' && (
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2 text-foreground">
            Model
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setModel('flash')}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
                model === 'flash'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent text-card-foreground border border-border'
              }`}
            >
              Flash (Fast)
            </button>
            <button
              onClick={() => setModel('pro')}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
                model === 'pro'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent text-card-foreground border border-border'
              }`}
            >
              Pro (HQ)
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {model === 'flash'
              ? 'Gemini 3 Flash: Fast generation with good quality'
              : 'Gemini 3 Pro: Higher quality with more detailed output'}
          </p>
        </div>
      )}

      {/* Model Selection - Only show for OpenRouter */}
      {provider === 'openrouter' && (
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2 text-foreground">
            Model
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setOpenRouterModel('glm-4.6v')}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
                openRouterModel === 'glm-4.6v'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent text-card-foreground border border-border'
              }`}
            >
              GLM-4.6v
            </button>
            <button
              onClick={() => setOpenRouterModel('qwen3-vl')}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
                openRouterModel === 'qwen3-vl'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent text-card-foreground border border-border'
              }`}
            >
              Qwen 3 VL
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {openRouterModel === 'glm-4.6v'
              ? 'Zhipu AI GLM-4.6v: Fast and accurate vision model'
              : 'Qwen 3 VL: 235B parameter model with advanced vision capabilities'}
          </p>
        </div>
      )}

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

      {/* Reference Image Upload */}
      <div className="mb-4">
        <label className="text-xs font-medium block mb-2 text-foreground">
          Reference Images (Optional)
        </label>

        <div className="space-y-3">
          <div {...getReferenceRootProps()} className="cursor-pointer" onPaste={handlePaste}>
            <input {...getReferenceInputProps()} />
            <div
              className={`
                w-full px-4 py-3 rounded border-2 border-dashed flex items-center justify-center gap-2 text-sm
                ${isReferenceDragActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <ImageIcon size={16} />
              <span>
                {referenceImages.length >= MAX_REFERENCE_IMAGES
                  ? `Max ${MAX_REFERENCE_IMAGES} references reached`
                  : `Add reference images (${referenceImages.length}/${MAX_REFERENCE_IMAGES})`}
              </span>
            </div>
          </div>

          {referenceImages.length < MAX_REFERENCE_IMAGES && (
            <p className="text-xs text-muted-foreground text-center">
              Drag & drop, click to select, or paste (Ctrl+V) images
            </p>
          )}

          {referenceImages.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {referenceImages.map((img) => (
                  <div key={img.id} className="border border-border rounded overflow-hidden">
                    <div className="relative">
                      <img
                        src={img.dataUrl}
                        alt="Reference"
                        className="w-full h-24 object-cover"
                      />
                      <button
                        onClick={() =>
                          setReferenceImages((prev) => prev.filter((x) => x.id !== img.id))
                        }
                        className="absolute top-1 right-1 p-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded"
                        title="Remove reference"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
            Generating UI...
          </>
        ) : (
          <>
            <Wand2 size={18} />
            Generate UI
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generated UI Preview */}
      {generatedCode && (
        <div className="space-y-3">
          <div className="border border-border rounded overflow-hidden">
            <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground flex justify-between items-center">
              <span>Generated UI</span>
              <div className="flex gap-1">
                <button
                  onClick={handlePreview}
                  className="p-1 hover:bg-background rounded"
                  title="Preview in new window"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={handleExportCode}
                  className="p-1 hover:bg-background rounded"
                  title="Export code"
                >
                  <Code size={14} />
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedCode || '')}
                  className="p-1 hover:bg-background rounded"
                  title="Copy code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-2 max-h-40 overflow-y-auto bg-background">
              <pre className="text-xs text-muted-foreground">
                {generatedCode.length > 200 ? generatedCode.substring(0, 200) + '...' : generatedCode}
              </pre>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm font-medium flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              onClick={handleExportCode}
              className="flex-1 px-3 py-2 bg-card hover:bg-accent border border-border text-card-foreground rounded text-sm font-medium flex items-center justify-center gap-2"
            >
              <Code size={16} />
              Export Code
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(generatedCode || '')}
              className="px-3 py-2 bg-card hover:bg-accent border border-border text-card-foreground rounded text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


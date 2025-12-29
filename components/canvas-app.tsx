'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas } from 'fabric';
import { FabricCanvas } from '@/components/canvas/fabric-canvas';
import { DrawingTools } from '@/components/canvas/drawing-tools';
import { ShapeProperties } from '@/components/canvas/shape-properties';
import { CanvasControls } from '@/components/canvas/canvas-controls';
import { AIGeneration } from '@/components/canvas/ai-generation';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { Moon, Sun, Wand2 } from 'lucide-react';

export function CanvasApp() {
  const canvasRef = useRef<Canvas | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const dimensions = useCanvasStore((state) => state.dimensions);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const deleteSelectedShape = useCanvasStore((state) => state.deleteSelectedShape);
  const selectedShapeId = useCanvasStore((state) => state.selectedShapeId);
  const setCanvasRef = useCanvasStore((state) => state.setCanvasRef);
  
  // Set canvas ref in store
  useEffect(() => {
    setCanvasRef(canvasRef);
  }, [setCanvasRef]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      
      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        e.preventDefault();
        deleteSelectedShape();
      }
      
      // Escape: Deselect
      if (e.key === 'Escape') {
        useCanvasStore.getState().selectShape(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteSelectedShape, selectedShapeId]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Renderer</h1>
            <p className="text-sm text-muted-foreground">Vector Canvas Editor</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Canvas: <span className="font-medium text-foreground">{dimensions.width} × {dimensions.height}px</span>
            </div>
            
            {/* AI Panel Toggle */}
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors ${
                showAIPanel 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-accent text-foreground'
              }`}
              title="Toggle AI Generation Panel"
            >
              <Wand2 size={18} />
              AI Generate
            </button>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
              title="Toggle dark mode"
            >
              {isDark ? <Sun size={20} className="text-foreground" /> : <Moon size={20} className="text-foreground" />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Drawing Tools Sidebar */}
        <DrawingTools />
        
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <FabricCanvas canvasRef={canvasRef} />
        </div>
        
        {/* Right Sidebar - Show either AI Generation or Shape Properties */}
        {showAIPanel ? <AIGeneration /> : <ShapeProperties />}
      </div>
      
      {/* Canvas Controls Footer */}
      <CanvasControls />
      
      {/* Keyboard Shortcuts Help */}
      <div className="bg-muted text-muted-foreground px-6 py-2 text-xs border-t border-border">
        <div className="flex gap-6">
          <span><kbd className="bg-background px-1.5 py-0.5 rounded border border-border">Ctrl+Z</kbd> Undo</span>
          <span><kbd className="bg-background px-1.5 py-0.5 rounded border border-border">Ctrl+Y</kbd> Redo</span>
          <span><kbd className="bg-background px-1.5 py-0.5 rounded border border-border">Del</kbd> Delete</span>
          <span><kbd className="bg-background px-1.5 py-0.5 rounded border border-border">Esc</kbd> Deselect</span>
        </div>
      </div>
    </div>
  );
}


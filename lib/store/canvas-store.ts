import { create } from 'zustand';
import { RefObject } from 'react';
import { Canvas } from 'fabric';
import { 
  Shape, 
  Tool, 
  DrawingSettings, 
  CanvasDimensions, 
  BackgroundImage,
  HistoryState 
} from '@/lib/types';

interface CanvasState {
  // Canvas properties
  canvasRef: RefObject<Canvas | null> | null;
  dimensions: CanvasDimensions;
  shapes: Shape[];
  selectedShapeId: string | null;
  currentTool: Tool;
  backgroundImage: BackgroundImage | null;
  pendingImage: string | null; // URL or data URL of image waiting to be placed
  pendingTextEditId: string | null; // text shape id to auto-enter editing after render
  isDarkMode: boolean;
  layerVersion: number;
  
  // Drawing settings
  drawingSettings: DrawingSettings;
  
  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Actions
  setCanvasRef: (ref: RefObject<Canvas | null>) => void;
  setDimensions: (dimensions: CanvasDimensions) => void;
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  deleteSelectedShape: () => void;
  selectShape: (id: string | null) => void;
  setTool: (tool: Tool) => void;
  setBackgroundImage: (image: BackgroundImage | null) => void;
  updateBackgroundOpacity: (opacity: number) => void;
  setPendingImage: (url: string | null) => void;
  setPendingTextEditId: (id: string | null) => void;
  toggleDarkMode: () => void;
  
  // Drawing settings actions
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setCornerRadius: (radius: number) => void;
  setFillEnabled: (enabled: boolean) => void;
  
  // Layer actions
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  
  // Clear and reset
  clearShapes: () => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  canvasRef: null,
  dimensions: { width: 1024, height: 768 },
  shapes: [],
  selectedShapeId: null,
  currentTool: 'select',
  backgroundImage: null,
  pendingImage: null,
  pendingTextEditId: null,
  isDarkMode: false,
  
  drawingSettings: {
    strokeColor: '#000000',
    fillColor: '#ffffff',
    strokeWidth: 2,
    cornerRadius: 0,
    fillEnabled: true,
  },
  
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  layerVersion: 0,
  
  // Canvas actions
  setCanvasRef: (ref) => set({ canvasRef: ref }),
  
  setDimensions: (dimensions) => {
    set({ dimensions });
    get().saveToHistory();
  },
  
  addShape: (shape) => {
    set((state) => ({
      shapes: [...state.shapes, shape],
    }));
    get().saveToHistory();
  },
  
  updateShape: (id, updates) => {
    set((state) => ({
      shapes: state.shapes.map((shape) =>
        shape.id === id ? ({ ...shape, ...updates } as Shape) : shape
      ),
    }));
  },
  
  deleteShape: (id) => {
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== id),
      selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
    }));
    get().saveToHistory();
  },
  
  deleteSelectedShape: () => {
    const { selectedShapeId } = get();
    if (selectedShapeId) {
      get().deleteShape(selectedShapeId);
    }
  },
  
  selectShape: (id) => {
    set({ selectedShapeId: id });
  },
  
  setTool: (tool) => {
    set({ currentTool: tool, selectedShapeId: null });
  },
  
  setBackgroundImage: (image) => {
    set({ backgroundImage: image });
    get().saveToHistory();
  },
  
  updateBackgroundOpacity: (opacity) => {
    set((state) => ({
      backgroundImage: state.backgroundImage
        ? { ...state.backgroundImage, opacity }
        : null,
    }));
  },
  
  setPendingImage: (url) => {
    set({ pendingImage: url });
  },

  setPendingTextEditId: (id) => {
    set({ pendingTextEditId: id });
  },
  
  toggleDarkMode: () => {
    set((state) => ({ isDarkMode: !state.isDarkMode }));
  },
  
  // Drawing settings actions
  setStrokeColor: (color) => {
    set((state) => ({
      drawingSettings: { ...state.drawingSettings, strokeColor: color },
    }));
  },
  
  setFillColor: (color) => {
    set((state) => ({
      drawingSettings: { ...state.drawingSettings, fillColor: color },
    }));
  },
  
  setStrokeWidth: (width) => {
    set((state) => ({
      drawingSettings: { ...state.drawingSettings, strokeWidth: width },
    }));
  },
  
  setCornerRadius: (radius) => {
    set((state) => ({
      drawingSettings: { ...state.drawingSettings, cornerRadius: radius },
    }));
  },
  
  setFillEnabled: (enabled) => {
    set((state) => ({
      drawingSettings: { ...state.drawingSettings, fillEnabled: enabled },
    }));
  },
  
  // Layer actions
  bringToFront: (id) => {
    set((state) => {
      const shapeIndex = state.shapes.findIndex((s) => s.id === id);
      if (shapeIndex === -1 || shapeIndex === state.shapes.length - 1) return state;
      
      const newShapes = [...state.shapes];
      const [shape] = newShapes.splice(shapeIndex, 1);
      newShapes.push(shape);
      
      return { shapes: newShapes };
    });
    get().saveToHistory();
  },
  
  sendToBack: (id) => {
    set((state) => {
      const shapeIndex = state.shapes.findIndex((s) => s.id === id);
      if (shapeIndex === -1 || shapeIndex === 0) return state;
      
      const newShapes = [...state.shapes];
      const [shape] = newShapes.splice(shapeIndex, 1);
      newShapes.unshift(shape);
      
      return { shapes: newShapes };
    });
    get().saveToHistory();
  },
  
  // History actions
  saveToHistory: () => {
    set((state) => {
      const currentState: HistoryState = {
        shapes: JSON.parse(JSON.stringify(state.shapes)),
        timestamp: Date.now(),
      };
      
      // Remove any history after current index
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(currentState);
      
      // Limit history size
      if (newHistory.length > state.maxHistorySize) {
        newHistory.shift();
      }
      
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },
  
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      set({
        shapes: JSON.parse(JSON.stringify(previousState.shapes)),
        historyIndex: historyIndex - 1,
      });
    }
  },
  
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        shapes: JSON.parse(JSON.stringify(nextState.shapes)),
        historyIndex: historyIndex + 1,
      });
    }
  },
  
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },
  
  canRedo: () => {
    const { historyIndex, history } = get();
    return historyIndex < history.length - 1;
  },
  
  // Clear actions
  clearShapes: () => {
    set({ shapes: [], selectedShapeId: null });
    get().saveToHistory();
  },
  
  clearCanvas: () => {
    set({
      shapes: [],
      selectedShapeId: null,
      backgroundImage: null,
      history: [],
      historyIndex: -1,
    });
  },
}));


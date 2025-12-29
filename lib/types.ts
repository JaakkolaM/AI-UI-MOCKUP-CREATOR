// Canvas shape types
export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'bezier'
  | 'polyline'
  | 'image'
  | 'text';

export type Tool = 
  | 'select'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'bezier'
  | 'polyline'
  | 'image'
  | 'delete';

// Base shape interface
export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  scaleX?: number;
  scaleY?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
    enabled: boolean;
  };
}

// Rectangle shape
export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  cornerRadius: number;
}

// Circle shape
export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
}

// Ellipse shape
export interface EllipseShape extends BaseShape {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
}

// Line shape
export interface LineShape extends BaseShape {
  type: 'line';
  points: number[]; // [x1, y1, x2, y2]
}

// Bezier curve shape
export interface BezierShape extends BaseShape {
  type: 'bezier';
  points: number[]; // Array of x,y coordinates for bezier curve
  closed?: boolean; // Whether the shape is closed
}

// Polyline shape (straight lines between multiple points)
export interface PolylineShape extends BaseShape {
  type: 'polyline';
  points: number[]; // Array of x,y coordinates
  closed?: boolean; // Whether the shape is closed
}

// Image shape
export interface ImageShape extends BaseShape {
  type: 'image';
  src: string; // Image URL or data URL
  width: number;
  height: number;
}

// Text shape (multi-line wrapping)
export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

// Union type of all shapes
export type Shape =
  | RectangleShape
  | CircleShape
  | EllipseShape
  | LineShape
  | BezierShape
  | PolylineShape
  | ImageShape
  | TextShape;

// Drawing settings
export interface DrawingSettings {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  cornerRadius: number;
  fillEnabled: boolean;
}

// Canvas dimensions
export interface CanvasDimensions {
  width: number;
  height: number;
}

// Background image
export interface BackgroundImage {
  url: string;
  width: number;
  height: number;
  opacity: number;
}

// History state for undo/redo
export interface HistoryState {
  shapes: Shape[];
  timestamp: number;
}

// Export formats
export type ExportFormat = 'png' | 'svg' | 'json';


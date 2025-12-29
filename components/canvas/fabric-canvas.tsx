'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, Rect, Circle, Ellipse, Line, FabricImage, Path, Polyline, Textbox } from 'fabric';
import * as fabric from 'fabric';
import { useCanvasStore } from '@/lib/store/canvas-store';
import { Shape } from '@/lib/types';

interface FabricCanvasProps {
  canvasRef: React.MutableRefObject<Canvas | null>;
}

export function FabricCanvas({ canvasRef }: FabricCanvasProps) {
  const containerRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentShapeRef = useRef<any>(null);
  const bezierPointsRef = useRef<number[]>([]);
  const polylinePointsRef = useRef<number[]>([]);
  const imageGhostRef = useRef<FabricImage | null>(null);
  const imageGhostSrcRef = useRef<string | null>(null);
  const imageGhostScaleRef = useRef<number>(1);
  
  const dimensions = useCanvasStore((state) => state.dimensions);
  const shapes = useCanvasStore((state) => state.shapes);
  const backgroundImage = useCanvasStore((state) => state.backgroundImage);
  const currentTool = useCanvasStore((state) => state.currentTool);
  const selectShape = useCanvasStore((state) => state.selectShape);
  const addShape = useCanvasStore((state) => state.addShape);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const drawingSettings = useCanvasStore((state) => state.drawingSettings);
  const isDarkMode = useCanvasStore((state) => state.isDarkMode);
  
  // Initialize Fabric canvas
  useEffect(() => {
    if (!containerRef.current || canvasRef.current) return;
    
    // Get canvas background color from CSS variables
    const isDark = document.documentElement.classList.contains('dark');
    const canvasBg = isDark ? '#1a1a1a' : '#ffffff';
    
    const canvas = new Canvas(containerRef.current, {
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: canvasBg,
    });
    
    canvasRef.current = canvas;
    
    // Handle object selection
    canvas.on('selection:created', (e) => {
      if (e.selected && e.selected[0]) {
        const selectedId = (e.selected[0] as any).customId;
        if (selectedId) selectShape(selectedId);
      }
    });
    
    canvas.on('selection:updated', (e) => {
      if (e.selected && e.selected[0]) {
        const selectedId = (e.selected[0] as any).customId;
        if (selectedId) selectShape(selectedId);
      }
    });
    
    canvas.on('selection:cleared', () => {
      selectShape(null);
    });
    
    // Handle object modification
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj && (obj as any).customId) {
        const id = (obj as any).customId;
        const updates: any = {
          x: obj.left || 0,
          y: obj.top || 0,
          rotation: obj.angle || 0,
        };
        
        // Handle dimension changes based on shape type
        if (obj instanceof Rect) {
          const scaleX = obj.scaleX || 1;
          const scaleY = obj.scaleY || 1;
          updates.width = (obj.width || 0) * scaleX;
          updates.height = (obj.height || 0) * scaleY;
          
          // Reset scale
          obj.set({ scaleX: 1, scaleY: 1 });
        } else if (obj instanceof Circle) {
          const scaleX = obj.scaleX || 1;
          const scaleY = obj.scaleY || 1;
          const radius = obj.radius || 0;
          
          // Check if scaled non-uniformly (becomes ellipse in store)
          if (Math.abs(scaleX - scaleY) > 0.01) {
            // Convert to ellipse type in store (but keep as Circle on canvas)
            updates.type = 'ellipse';
            updates.radiusX = radius * scaleX;
            updates.radiusY = radius * scaleY;
            delete updates.radius;
            
            // Keep the scale on the circle object (don't reset it)
          } else {
            // Keep as circle with uniform scale
            const newRadius = radius * Math.max(scaleX, scaleY);
            updates.radius = newRadius;
            
            // Reset scale and update radius
            obj.set({ radius: newRadius, scaleX: 1, scaleY: 1 });
          }
        } else if (obj instanceof Ellipse) {
          const scaleX = obj.scaleX || 1;
          const scaleY = obj.scaleY || 1;
          updates.radiusX = (obj.rx || 0) * scaleX;
          updates.radiusY = (obj.ry || 0) * scaleY;
          
          // Reset scale
          obj.set({ scaleX: 1, scaleY: 1 });
        } else if (obj instanceof Line) {
          // Update line endpoints - apply scale to get actual positions
          const line = obj as Line;
          const scaleX = line.scaleX || 1;
          const scaleY = line.scaleY || 1;
          
          // Calculate actual endpoint positions after scaling
          const x1 = (line.x1 || 0) * scaleX;
          const y1 = (line.y1 || 0) * scaleY;
          const x2 = (line.x2 || 0) * scaleX;
          const y2 = (line.y2 || 0) * scaleY;
          
          updates.points = [x1, y1, x2, y2];
          
          // Update the line with new coordinates and reset scale
          line.set({ x1, y1, x2, y2, scaleX: 1, scaleY: 1 });
          line.setCoords();
        } else if (obj instanceof Path || obj instanceof Polyline) {
          // For Path (bezier) and Polyline, save scale transforms
          updates.scaleX = obj.scaleX || 1;
          updates.scaleY = obj.scaleY || 1;
        } else if (obj instanceof Textbox) {
          // For Textbox, convert horizontal scaling into width and reset scale
          const scaleX = obj.scaleX || 1;
          const scaleY = obj.scaleY || 1;
          updates.width = (obj.width || 0) * scaleX;
          updates.scaleX = 1;
          updates.scaleY = 1;
          updates.text = obj.text || '';

          // Keep font-related props in sync when changed by Fabric/UI
          updates.fontSize = (obj as any).fontSize || updates.fontSize;
          updates.fontFamily = (obj as any).fontFamily || updates.fontFamily;
          updates.fontWeight = (obj as any).fontWeight || updates.fontWeight;
          updates.fontStyle = (obj as any).fontStyle || updates.fontStyle;
          updates.textAlign = (obj as any).textAlign || updates.textAlign;

          // Reset scale to avoid compound scaling
          obj.set({ scaleX: 1, scaleY: 1, width: updates.width });
          obj.setCoords();
        } else if (obj instanceof FabricImage) {
          // For images, save all transforms including scale
          updates.scaleX = obj.scaleX || 1;
          updates.scaleY = obj.scaleY || 1;
          updates.width = (obj.width || 0) * (obj.scaleX || 1);
          updates.height = (obj.height || 0) * (obj.scaleY || 1);
        }
        
        // Capture shadow properties if present
        if (obj.shadow) {
          const shadow = obj.shadow as fabric.Shadow;
          // Extract opacity from rgba color if present
          let shadowOpacity = 1;
          const colorStr = shadow.color || '#000000';
          if (colorStr.startsWith('rgba')) {
            const match = colorStr.match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/);
            if (match) {
              shadowOpacity = parseFloat(match[1]);
            }
          }
          
          // Convert rgba back to hex for storage
          let hexColor = '#000000';
          if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
            const match = colorStr.match(/\d+/g);
            if (match && match.length >= 3) {
              hexColor = '#' + match.slice(0, 3).map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
              }).join('');
            }
          } else {
            hexColor = colorStr;
          }
          
          updates.shadow = {
            color: hexColor,
            blur: shadow.blur || 0,
            offsetX: shadow.offsetX || 0,
            offsetY: shadow.offsetY || 0,
            opacity: shadowOpacity,
            enabled: true,
          };
        }
        
        updateShape(id, updates);
      }
    });
    
    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []);
  
  // Update canvas background when dark mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasBg = isDarkMode ? '#1a1a1a' : '#ffffff';
    canvas.set('backgroundColor', canvasBg);
    canvas.renderAll();
  }, [isDarkMode]);
  
  // Setup drawing event handlers (updated when tool or settings change)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMouseDown = (e: any) => {
      const tool = useCanvasStore.getState().currentTool;
      const settings = useCanvasStore.getState().drawingSettings;
      const pendingImage = useCanvasStore.getState().pendingImage;
      
      if (tool === 'select' || tool === 'delete') return;
      
      const pointer = canvas.getPointer(e.e);

      // Text tool: click to place → auto-select → auto-edit → switch to select
      if (tool === 'text') {
        const id = `shape-${Date.now()}-${Math.random()}`;
        useCanvasStore.getState().addShape({
          id,
          type: 'text',
          text: 'Text',
          x: pointer.x,
          y: pointer.y,
          width: 260,
          fontSize: 32,
          fontFamily: 'Arial',
          fontStyle: 'normal',
          fontWeight: 'normal',
          textAlign: 'left',
          rotation: 0,
          // Use fillColor as text color; default to stroke color from settings
          fillColor: settings.strokeColor,
          // Optional outline
          strokeColor: 'transparent',
          strokeWidth: 0,
          opacity: 1,
        } as any);

        useCanvasStore.getState().selectShape(id);
        useCanvasStore.getState().setPendingTextEditId(id);
        useCanvasStore.getState().setTool('select');
        return;
      }
      
      // Image tool: ghost preview → click to place → auto-select
      if (tool === 'image') {
        if (!pendingImage) return;
        if (!imageGhostRef.current || imageGhostSrcRef.current !== pendingImage) return;

        const img = imageGhostRef.current;
        const id = `shape-${Date.now()}-${Math.random()}`;

        // Convert ghost to real object
        (img as any).data = { ...(img as any).data, isImageGhost: false };
        img.set({
          selectable: true,
          evented: true,
          opacity: 1,
        });
        (img as any).customId = id;

        // Ensure it is on canvas and selected
        if (!canvas.getObjects().includes(img)) {
          canvas.add(img);
        }
        canvas.setActiveObject(img);
        canvas.renderAll();

        // Persist to store
        const scaleX = img.scaleX || 1;
        const scaleY = img.scaleY || 1;
        useCanvasStore.getState().addShape({
          id,
          type: 'image',
          src: pendingImage,
          x: img.left || pointer.x,
          y: img.top || pointer.y,
          width: (img.width || 0) * scaleX,
          height: (img.height || 0) * scaleY,
          scaleX,
          scaleY,
          rotation: img.angle || 0,
          strokeColor: '',
          fillColor: '',
          strokeWidth: 0,
          opacity: 1,
        });

        // Auto-select in store and switch to select tool for immediate editing
        useCanvasStore.getState().selectShape(id);
        useCanvasStore.getState().setTool('select');
        useCanvasStore.getState().setPendingImage(null);

        // Clear ghost refs (object stays on canvas as real object)
        imageGhostRef.current = null;
        imageGhostSrcRef.current = null;
        imageGhostScaleRef.current = 1;

        return;
      }
      
      // Handle bezier tool separately (multi-click)
      if (tool === 'bezier') {
        // Check if clicking near the first point to close the shape (need at least 3 points)
        const closeThreshold = 15; // pixels
        let shouldClose = false;
        
        if (bezierPointsRef.current.length >= 6) {
          const firstX = bezierPointsRef.current[0];
          const firstY = bezierPointsRef.current[1];
          const distance = Math.sqrt(Math.pow(pointer.x - firstX, 2) + Math.pow(pointer.y - firstY, 2));
          
          if (distance < closeThreshold) {
            shouldClose = true;
            // Snap to first point to close perfectly
            pointer.x = firstX;
            pointer.y = firstY;
          }
        }
        
        bezierPointsRef.current.push(pointer.x, pointer.y);
        
        // Add a small circle at each point for visual feedback
        // Make the first point larger to show it's the closing target
        const isFirstPoint = bezierPointsRef.current.length === 2;
        const pointMarker = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: isFirstPoint ? 6 : 4,
          fill: settings.strokeColor,
          stroke: isFirstPoint ? '#ffffff' : undefined,
          strokeWidth: isFirstPoint ? 2 : 0,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          data: { isBezierMarker: true, isFirstPoint },
        });
        canvas.add(pointMarker);
        
        // If closing the shape, finalize it immediately
        if (shouldClose) {
          // Remove all preview elements
          const objectsToRemove = canvas.getObjects().filter((obj: any) => 
            obj.data?.isBezierMarker || obj.data?.isBezierPreview
          );
          objectsToRemove.forEach(obj => canvas.remove(obj));
          
          if (currentShapeRef.current) {
            canvas.remove(currentShapeRef.current);
            currentShapeRef.current = null;
          }
          
          // Add closed shape to store
          const id = `shape-${Date.now()}-${Math.random()}`;
          useCanvasStore.getState().addShape({
            id,
            type: 'bezier',
            x: 0,
            y: 0,
            points: [...bezierPointsRef.current],
            strokeColor: settings.strokeColor,
            fillColor: settings.fillEnabled ? settings.fillColor : 'transparent',
            strokeWidth: settings.strokeWidth,
            opacity: 1,
            rotation: 0,
            closed: true,
          });
          
          // Reset
          bezierPointsRef.current = [];
          canvas.renderAll();
          return;
        }
        
        if (bezierPointsRef.current.length >= 2) {
          // Remove old preview (but keep point markers)
          if (currentShapeRef.current) {
            canvas.remove(currentShapeRef.current);
          }
          
          // Convert to point objects
          const points: Array<{x: number, y: number}> = [];
          for (let i = 0; i < bezierPointsRef.current.length; i += 2) {
            points.push({ x: bezierPointsRef.current[i], y: bezierPointsRef.current[i + 1] });
          }
          
          // Create preview curve using same algorithm as final render
          let pathString = `M ${points[0].x} ${points[0].y}`;
          
          if (points.length === 2) {
            pathString += ` L ${points[1].x} ${points[1].y}`;
          } else if (points.length === 3) {
            pathString += ` Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`;
          } else {
            // Catmull-Rom spline preview
            const tension = 0;
            for (let i = 0; i < points.length - 1; i++) {
              const p0 = i > 0 ? points[i - 1] : points[i];
              const p1 = points[i];
              const p2 = points[i + 1];
              const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];
              
              const cp1x = p1.x + (p2.x - p0.x) / 6 * (1 - tension);
              const cp1y = p1.y + (p2.y - p0.y) / 6 * (1 - tension);
              const cp2x = p2.x - (p3.x - p1.x) / 6 * (1 - tension);
              const cp2y = p2.y - (p3.y - p1.y) / 6 * (1 - tension);
              
              pathString += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
            }
          }
          
          const previewPath = new Path(pathString, {
            stroke: settings.strokeColor,
            strokeWidth: settings.strokeWidth,
            selectable: false,
            evented: false,
            strokeDashArray: [5, 5],
            fill: '',
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
            data: { isBezierPreview: true },
          });
          
          canvas.add(previewPath);
          currentShapeRef.current = previewPath;
          canvas.renderAll();
        }
        return;
      }
      
      // Handle polyline tool separately (multi-click, straight lines)
      if (tool === 'polyline') {
        // Check if clicking near the first point to close the shape (need at least 3 points)
        const closeThreshold = 15; // pixels
        let shouldClose = false;
        
        if (polylinePointsRef.current.length >= 6) {
          const firstX = polylinePointsRef.current[0];
          const firstY = polylinePointsRef.current[1];
          const distance = Math.sqrt(Math.pow(pointer.x - firstX, 2) + Math.pow(pointer.y - firstY, 2));
          
          if (distance < closeThreshold) {
            shouldClose = true;
            // Snap to first point to close perfectly
            pointer.x = firstX;
            pointer.y = firstY;
          }
        }
        
        polylinePointsRef.current.push(pointer.x, pointer.y);
        
        // Add a small circle at each point for visual feedback
        // Make the first point larger to show it's the closing target
        const isFirstPoint = polylinePointsRef.current.length === 2;
        const pointMarker = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: isFirstPoint ? 6 : 4,
          fill: settings.strokeColor,
          stroke: isFirstPoint ? '#ffffff' : undefined,
          strokeWidth: isFirstPoint ? 2 : 0,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          data: { isPolylineMarker: true, isFirstPoint },
        });
        canvas.add(pointMarker);
        
        // If closing the shape, finalize it immediately
        if (shouldClose) {
          // Remove all preview elements
          const objectsToRemove = canvas.getObjects().filter((obj: any) => 
            obj.data?.isPolylineMarker || obj.data?.isPolylinePreview
          );
          objectsToRemove.forEach(obj => canvas.remove(obj));
          
          if (currentShapeRef.current) {
            canvas.remove(currentShapeRef.current);
            currentShapeRef.current = null;
          }
          
          // Add closed shape to store
          const id = `shape-${Date.now()}-${Math.random()}`;
          useCanvasStore.getState().addShape({
            id,
            type: 'polyline',
            x: 0,
            y: 0,
            points: [...polylinePointsRef.current],
            strokeColor: settings.strokeColor,
            fillColor: settings.fillEnabled ? settings.fillColor : 'transparent',
            strokeWidth: settings.strokeWidth,
            opacity: 1,
            rotation: 0,
            closed: true,
          });
          
          // Reset
          polylinePointsRef.current = [];
          canvas.renderAll();
          return;
        }
        
        if (polylinePointsRef.current.length >= 2) {
          // Remove old preview (but keep point markers)
          if (currentShapeRef.current) {
            canvas.remove(currentShapeRef.current);
          }
          
          // Draw preview polyline (straight lines connecting all points)
          const points: number[] = [];
          for (let i = 0; i < polylinePointsRef.current.length; i += 2) {
            points.push(polylinePointsRef.current[i], polylinePointsRef.current[i + 1]);
          }
          
          const previewPolyline = new fabric.Polyline(
            points.map((val, i) => (i % 2 === 0 ? { x: val, y: points[i + 1] } : null)).filter(Boolean) as fabric.Point[],
            {
              stroke: settings.strokeColor,
              strokeWidth: settings.strokeWidth,
              fill: '',
              selectable: false,
              evented: false,
              strokeDashArray: [5, 5],
              strokeLineCap: 'round',
              strokeLineJoin: 'round',
              data: { isPolylinePreview: true },
            }
          );
          
          canvas.add(previewPolyline);
          currentShapeRef.current = previewPolyline;
          canvas.renderAll();
        }
        return;
      }
      
      isDrawingRef.current = true;
      startPointRef.current = { x: pointer.x, y: pointer.y };
      
      // Create shape based on tool
      let shape: any = null;
      const commonProps = {
        fill: settings.fillEnabled ? settings.fillColor : 'transparent',
        stroke: settings.strokeColor,
        strokeWidth: settings.strokeWidth,
        selectable: false,
        evented: false,
      };
      
      if (tool === 'rectangle') {
        shape = new Rect({
          ...commonProps,
          left: pointer.x,
          top: pointer.y,
          width: 1,
          height: 1,
          rx: settings.cornerRadius,
          ry: settings.cornerRadius,
        });
      } else if (tool === 'circle') {
        shape = new Circle({
          ...commonProps,
          left: pointer.x,
          top: pointer.y,
          radius: 1,
        });
      } else if (tool === 'ellipse') {
        shape = new Ellipse({
          ...commonProps,
          left: pointer.x,
          top: pointer.y,
          rx: 1,
          ry: 1,
        });
      } else if (tool === 'line') {
        shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: settings.strokeColor,
          strokeWidth: settings.strokeWidth,
          selectable: false,
          evented: false,
        });
      }
      
      if (shape) {
        canvas.add(shape);
        currentShapeRef.current = shape;
        canvas.renderAll();
      }
    };
    
    const handleMouseMove = (e: any) => {
      // Image ghost follows mouse
      const tool = useCanvasStore.getState().currentTool;
      const pendingImage = useCanvasStore.getState().pendingImage;
      if (tool === 'image' && pendingImage) {
        const pointer = canvas.getPointer(e.e);

        // (Re)load ghost if needed
        if (!imageGhostRef.current || imageGhostSrcRef.current !== pendingImage) {
          // Remove previous ghost if any
          if (imageGhostRef.current) {
            canvas.remove(imageGhostRef.current);
          }

          imageGhostRef.current = null;
          imageGhostSrcRef.current = pendingImage;
          imageGhostScaleRef.current = 1;

          FabricImage.fromURL(pendingImage, { crossOrigin: 'anonymous' }).then((img) => {
            // Might have been cleared while loading
            const latestTool = useCanvasStore.getState().currentTool;
            const latestPending = useCanvasStore.getState().pendingImage;
            if (latestTool !== 'image' || latestPending !== pendingImage) return;

            const maxSize = 400;
            let scale = 1;
            if ((img.width || 0) > maxSize || (img.height || 0) > maxSize) {
              scale = maxSize / Math.max(img.width || 1, img.height || 1);
            }
            imageGhostScaleRef.current = scale;

            img.set({
              left: pointer.x,
              top: pointer.y,
              scaleX: scale,
              scaleY: scale,
              opacity: 0.6,
              selectable: false,
              evented: false,
            });
            (img as any).data = { isImageGhost: true };

            // Add on top during preview
            canvas.add(img);
            imageGhostRef.current = img;
            canvas.renderAll();
          });
        } else if (imageGhostRef.current) {
          imageGhostRef.current.set({ left: pointer.x, top: pointer.y });
          canvas.renderAll();
        }

        return;
      }

      if (!isDrawingRef.current || !startPointRef.current || !currentShapeRef.current) return;
      
      // tool already declared above for image branch; redeclare for drawing branch
      const toolDraw = useCanvasStore.getState().currentTool;
      const pointer = canvas.getPointer(e.e);
      const shape = currentShapeRef.current;
      
      if (toolDraw === 'rectangle') {
        const width = Math.abs(pointer.x - startPointRef.current.x);
        const height = Math.abs(pointer.y - startPointRef.current.y);
        const left = Math.min(pointer.x, startPointRef.current.x);
        const top = Math.min(pointer.y, startPointRef.current.y);
        shape.set({ width, height, left, top });
      } else if (toolDraw === 'circle') {
        const radius = Math.sqrt(
          Math.pow(pointer.x - startPointRef.current.x, 2) + 
          Math.pow(pointer.y - startPointRef.current.y, 2)
        );
        shape.set({ radius });
      } else if (toolDraw === 'ellipse') {
        const rx = Math.abs(pointer.x - startPointRef.current.x);
        const ry = Math.abs(pointer.y - startPointRef.current.y);
        shape.set({ rx, ry });
      } else if (toolDraw === 'line') {
        shape.set({ x2: pointer.x, y2: pointer.y });
      }
      
      canvas.renderAll();
    };
    
    const handleMouseUp = () => {
      const tool = useCanvasStore.getState().currentTool;
      
      // Skip bezier tool (handled by mouse down)
      if (tool === 'bezier') return;
      
      if (!isDrawingRef.current || !currentShapeRef.current || !startPointRef.current) return;
      
      const settings = useCanvasStore.getState().drawingSettings;
      const shape = currentShapeRef.current;
      
      isDrawingRef.current = false;
      canvas.remove(shape);
      
      // Add to Zustand store
      const id = `shape-${Date.now()}-${Math.random()}`;
      
      if (tool === 'rectangle') {
        const width = shape.width || 0;
        const height = shape.height || 0;
        if (width > 5 && height > 5) {
          useCanvasStore.getState().addShape({
            id,
            type: 'rectangle',
            x: shape.left || 0,
            y: shape.top || 0,
            width,
            height,
            cornerRadius: settings.cornerRadius,
            strokeColor: settings.strokeColor,
            fillColor: settings.fillEnabled ? settings.fillColor : 'transparent',
            strokeWidth: settings.strokeWidth,
            opacity: 1,
            rotation: 0,
          });
        }
      } else if (tool === 'circle') {
        const radius = shape.radius || 0;
        if (radius > 5) {
          useCanvasStore.getState().addShape({
            id,
            type: 'circle',
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            radius,
            strokeColor: settings.strokeColor,
            fillColor: settings.fillEnabled ? settings.fillColor : 'transparent',
            strokeWidth: settings.strokeWidth,
            opacity: 1,
            rotation: 0,
          });
        }
      } else if (tool === 'ellipse') {
        const rx = shape.rx || 0;
        const ry = shape.ry || 0;
        if (rx > 5 && ry > 5) {
          useCanvasStore.getState().addShape({
            id,
            type: 'ellipse',
            x: startPointRef.current.x,
            y: startPointRef.current.y,
            radiusX: rx,
            radiusY: ry,
            strokeColor: settings.strokeColor,
            fillColor: settings.fillEnabled ? settings.fillColor : 'transparent',
            strokeWidth: settings.strokeWidth,
            opacity: 1,
            rotation: 0,
          });
        }
      } else if (tool === 'line') {
        useCanvasStore.getState().addShape({
          id,
          type: 'line',
          x: shape.left || 0,
          y: shape.top || 0,
          points: [shape.x1 || 0, shape.y1 || 0, shape.x2 || 0, shape.y2 || 0],
          strokeColor: settings.strokeColor,
          fillColor: 'transparent',
          strokeWidth: settings.strokeWidth,
          opacity: 1,
          rotation: shape.angle || 0,
        });
      }
      
      currentShapeRef.current = null;
      startPointRef.current = null;
      canvas.renderAll();
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const tool = useCanvasStore.getState().currentTool;
      const settings = useCanvasStore.getState().drawingSettings;
      
      // Finish bezier curve on Enter or Escape
      if (tool === 'bezier' && (e.key === 'Enter' || e.key === 'Escape')) {
        if (bezierPointsRef.current.length >= 6) {
          // Add to store (minimum 3 points for a quadratic curve)
          const id = `shape-${Date.now()}-${Math.random()}`;
          useCanvasStore.getState().addShape({
            id,
            type: 'bezier',
            x: 0,
            y: 0,
            points: [...bezierPointsRef.current],
            strokeColor: settings.strokeColor,
            fillColor: 'transparent',
            strokeWidth: settings.strokeWidth,
            opacity: 1,
            rotation: 0,
          });
        }
        
        // Remove all preview elements (markers and lines)
        const objectsToRemove = canvas.getObjects().filter((obj: any) => 
          obj.data?.isBezierMarker || obj.data?.isBezierPreview
        );
        objectsToRemove.forEach(obj => canvas.remove(obj));
        
        if (currentShapeRef.current) {
          canvas.remove(currentShapeRef.current);
          currentShapeRef.current = null;
        }
        
        // Reset
        bezierPointsRef.current = [];
        canvas.renderAll();
      }
      
      // Finish polyline on Enter or Escape
      if (tool === 'polyline' && (e.key === 'Enter' || e.key === 'Escape')) {
        if (polylinePointsRef.current.length >= 4) {
          // Add to store (minimum 2 points for a line)
          const id = `shape-${Date.now()}-${Math.random()}`;
          useCanvasStore.getState().addShape({
            id,
            type: 'polyline',
            x: 0,
            y: 0,
            points: [...polylinePointsRef.current],
            strokeColor: settings.strokeColor,
            fillColor: 'transparent',
            strokeWidth: settings.strokeWidth,
            opacity: 1,
            rotation: 0,
            closed: false,
          });
        }
        
        // Remove all preview elements (markers and lines)
        const objectsToRemove = canvas.getObjects().filter((obj: any) => 
          obj.data?.isPolylineMarker || obj.data?.isPolylinePreview
        );
        objectsToRemove.forEach(obj => canvas.remove(obj));
        
        if (currentShapeRef.current) {
          canvas.remove(currentShapeRef.current);
          currentShapeRef.current = null;
        }
        
        // Reset
        polylinePointsRef.current = [];
        canvas.renderAll();
      }
    };
    
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentTool, drawingSettings]);
  
  // Clear bezier points when switching tools
  useEffect(() => {
    // Clear image ghost when switching away from image tool
    if (currentTool !== 'image' && imageGhostRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.remove(imageGhostRef.current);
        canvas.renderAll();
      }
      imageGhostRef.current = null;
      imageGhostSrcRef.current = null;
      imageGhostScaleRef.current = 1;
      // Also clear pending image so accidental placement doesn't happen later
      useCanvasStore.getState().setPendingImage(null);
    }

    if (currentTool !== 'bezier' && bezierPointsRef.current.length > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        // Remove all preview elements (markers and lines)
        const objectsToRemove = canvas.getObjects().filter((obj: any) => 
          obj.data?.isBezierMarker || obj.data?.isBezierPreview
        );
        objectsToRemove.forEach(obj => canvas.remove(obj));
        
        if (currentShapeRef.current) {
          canvas.remove(currentShapeRef.current);
          currentShapeRef.current = null;
        }
        canvas.renderAll();
      }
      bezierPointsRef.current = [];
    }
    
    // Clear polyline points when switching tools
    if (currentTool !== 'polyline' && polylinePointsRef.current.length > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        // Remove all preview elements (markers and lines)
        const objectsToRemove = canvas.getObjects().filter((obj: any) => 
          obj.data?.isPolylineMarker || obj.data?.isPolylinePreview
        );
        objectsToRemove.forEach(obj => canvas.remove(obj));
        
        if (currentShapeRef.current) {
          canvas.remove(currentShapeRef.current);
          currentShapeRef.current = null;
        }
        canvas.renderAll();
      }
      polylinePointsRef.current = [];
    }
  }, [currentTool]);
  
  // Update canvas dimensions and selection mode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.setDimensions({
      width: dimensions.width,
      height: dimensions.height,
    });
    
    // Enable/disable selection based on tool
    canvas.selection = currentTool === 'select';
    
    // Make objects selectable/non-selectable
    canvas.forEachObject((obj) => {
      obj.selectable = currentTool === 'select';
      obj.evented = currentTool === 'select';
    });
    
    canvas.renderAll();
  }, [dimensions, currentTool]);
  
  // Load background image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Remove existing background
    const existingBg = canvas.backgroundImage;
    if (existingBg) {
      canvas.backgroundImage = undefined;
    }
    
    if (backgroundImage?.url) {
      FabricImage.fromURL(backgroundImage.url, {
        crossOrigin: 'anonymous',
      }).then((img) => {
        img.scaleToWidth(dimensions.width);
        img.scaleToHeight(dimensions.height);
        img.set({
          opacity: backgroundImage.opacity,
          selectable: false,
          evented: false,
        });
        canvas.backgroundImage = img;
        canvas.renderAll();
      });
    } else {
      canvas.renderAll();
    }
  }, [backgroundImage, dimensions]);
  
  // Sync shapes to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const selectedShapeId = useCanvasStore.getState().selectedShapeId;
    const pendingTextEditId = useCanvasStore.getState().pendingTextEditId;

    // If a textbox is currently being edited, keep it on-canvas to avoid breaking editing.
    const active = canvas.getActiveObject() as any;
    const activeEditingTextId =
      active && (active as any).isEditing && (active as any).customId ? (active as any).customId : null;
    
    // Remove all objects (but keep background)
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (activeEditingTextId && (obj as any).customId === activeEditingTextId) return;
      canvas.remove(obj);
    });
    
    let objectToSelect: any = null;
    
    // Process shapes in order to maintain z-index
    const addShapesToCanvas = async () => {
      for (const shape of shapes) {
        let fabricObj: any = null;

        // Skip re-creating the actively edited textbox
        if (activeEditingTextId && shape.id === activeEditingTextId) {
          continue;
        }
      
      switch (shape.type) {
        case 'rectangle':
          fabricObj = new Rect({
            left: shape.x,
            top: shape.y,
            width: shape.width,
            height: shape.height,
            fill: shape.fillColor,
            stroke: shape.strokeColor,
            strokeWidth: shape.strokeWidth,
            rx: shape.cornerRadius,
            ry: shape.cornerRadius,
            angle: shape.rotation,
            opacity: shape.opacity,
          });
          break;
          
        case 'circle':
          fabricObj = new Circle({
            left: shape.x,
            top: shape.y,
            radius: shape.radius,
            fill: shape.fillColor,
            stroke: shape.strokeColor,
            strokeWidth: shape.strokeWidth,
            angle: shape.rotation,
            opacity: shape.opacity,
            originX: 'center',
            originY: 'center',
            lockUniScaling: false, // Allow non-uniform scaling to create ellipse
          });
          break;
          
        case 'ellipse':
          fabricObj = new Ellipse({
            left: shape.x,
            top: shape.y,
            rx: shape.radiusX,
            ry: shape.radiusY,
            fill: shape.fillColor,
            stroke: shape.strokeColor,
            strokeWidth: shape.strokeWidth,
            angle: shape.rotation,
            opacity: shape.opacity,
            originX: 'center',
            originY: 'center',
          });
          break;
          
        case 'line':
          {
            const pts =
              shape.points && shape.points.length === 4
                ? (shape.points as [number, number, number, number])
                : ([0, 0, 100, 0] as [number, number, number, number]);
            fabricObj = new Line(pts, {
            left: shape.x,
            top: shape.y,
            angle: shape.rotation,
            stroke: shape.strokeColor,
            strokeWidth: shape.strokeWidth,
            opacity: shape.opacity,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingFlip: true,
            hasRotatingPoint: true,
            hasBorders: true,
            hasControls: true,
            });
          }
          
          // Configure line controls - show all corners for easier manipulation
          if (fabricObj) {
            fabricObj.setControlsVisibility({
              tl: true,  // top-left corner
              tr: true,  // top-right corner
              bl: true,  // bottom-left corner
              br: true,  // bottom-right corner
              ml: false, // middle-left
              mt: false, // middle-top
              mr: false, // middle-right
              mb: false, // middle-bottom
              mtr: true, // rotation control
            });
          }
          break;
          
        case 'bezier':
          // Create a smooth Catmull-Rom spline through all points
          if (shape.points && shape.points.length >= 6) {
            const points: Array<{x: number, y: number}> = [];
            for (let i = 0; i < shape.points.length; i += 2) {
              points.push({ x: shape.points[i], y: shape.points[i + 1] });
            }
            
            let pathString = `M ${points[0].x} ${points[0].y}`;
            
            if (points.length === 2) {
              // Just a line for 2 points
              pathString += ` L ${points[1].x} ${points[1].y}`;
            } else if (points.length === 3) {
              // Quadratic curve for 3 points
              pathString += ` Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`;
            } else {
              // For 4+ points, use Catmull-Rom spline (very smooth)
              const tension = 0; // 0 = Catmull-Rom, adjust between -1 and 1 for tighter/looser curves
              
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = i > 0 ? points[i - 1] : points[i];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];
                
                // Catmull-Rom to Bezier conversion
                const cp1x = p1.x + (p2.x - p0.x) / 6 * (1 - tension);
                const cp1y = p1.y + (p2.y - p0.y) / 6 * (1 - tension);
                const cp2x = p2.x - (p3.x - p1.x) / 6 * (1 - tension);
                const cp2y = p2.y - (p3.y - p1.y) / 6 * (1 - tension);
                
                pathString += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
              }
            }
            
            // Close the path if it's a closed shape
            if ((shape as any).closed) {
              pathString += ' Z';
            }
            
            fabricObj = new Path(pathString, {
              stroke: shape.strokeColor,
              strokeWidth: shape.strokeWidth,
              opacity: shape.opacity,
              fill: (shape as any).closed ? shape.fillColor : '',
              strokeLineCap: 'round',
              strokeLineJoin: 'round',
              objectCaching: false,
            });
            
            // Apply transforms after creation
            if (fabricObj) {
              fabricObj.set({
                left: shape.x || fabricObj.left,
                top: shape.y || fabricObj.top,
                angle: shape.rotation || 0,
                scaleX: shape.scaleX || 1,
                scaleY: shape.scaleY || 1,
              });
            }
          }
          break;
          
        case 'polyline':
          // Create a polyline (straight lines through all points)
          if (shape.points && shape.points.length >= 4) {
            const points: fabric.Point[] = [];
            for (let i = 0; i < shape.points.length; i += 2) {
              points.push(new fabric.Point(shape.points[i], shape.points[i + 1]));
            }
            
            fabricObj = new Polyline(points, {
              stroke: shape.strokeColor,
              strokeWidth: shape.strokeWidth,
              opacity: shape.opacity,
              fill: (shape as any).closed ? shape.fillColor : '',
              strokeLineCap: 'round',
              strokeLineJoin: 'round',
              objectCaching: false,
            });
            
            // Apply transforms after creation
            if (fabricObj) {
              fabricObj.set({
                left: shape.x || fabricObj.left,
                top: shape.y || fabricObj.top,
                angle: shape.rotation || 0,
                scaleX: shape.scaleX || 1,
                scaleY: shape.scaleY || 1,
              });
            }
          }
          break;
          
        case 'image':
          // Load image asynchronously
          if (shape.src) {
            try {
              fabricObj = await FabricImage.fromURL(shape.src, {
                crossOrigin: 'anonymous',
              });
              
              const imgW = fabricObj.width || 1;
              const imgH = fabricObj.height || 1;
              const targetW = shape.width || imgW;
              const targetH = shape.height || imgH;
              const sx = targetW / imgW;
              const sy = targetH / imgH;

              fabricObj.set({
                left: shape.x,
                top: shape.y,
                angle: shape.rotation,
                scaleX: sx,
                scaleY: sy,
                opacity: shape.opacity,
              });
            } catch (error) {
              console.error('Failed to load image:', error);
            }
          }
          break;

        case 'text':
          {
            const textShape: any = shape as any;
            // Fabric internals may call `.toLowerCase()` on certain string props;
            // ensure we always pass safe defaults.
            const safeText = String(textShape.text ?? '');
            const safeFontFamily = typeof textShape.fontFamily === 'string' && textShape.fontFamily.trim()
              ? textShape.fontFamily
              : 'Arial';
            const safeFontStyle =
              textShape.fontStyle === 'italic' ? 'italic' : 'normal';
            const safeTextAlign =
              textShape.textAlign === 'center' ||
              textShape.textAlign === 'right' ||
              textShape.textAlign === 'justify'
                ? textShape.textAlign
                : 'left';
            const safeFill = typeof textShape.fillColor === 'string' && textShape.fillColor.trim()
              ? textShape.fillColor
              : '#000000';
            const safeStroke = typeof textShape.strokeColor === 'string' && textShape.strokeColor.trim()
              ? textShape.strokeColor
              : 'transparent';

            fabricObj = new Textbox(safeText, {
              left: textShape.x,
              top: textShape.y,
              width: textShape.width ?? 260,
              fontSize: textShape.fontSize ?? 32,
              fontFamily: safeFontFamily,
              fontWeight: textShape.fontWeight ?? 'normal',
              fontStyle: safeFontStyle,
              textAlign: safeTextAlign,
              fill: safeFill,
              stroke: safeStroke,
              strokeWidth: textShape.strokeWidth ?? 0,
              angle: textShape.rotation,
              opacity: textShape.opacity,
              originX: 'left',
              originY: 'top',
              editable: true,
            } as any);
          }
          break;
      }
      
      if (fabricObj) {
        (fabricObj as any).customId = shape.id;
        fabricObj.selectable = currentTool === 'select';
        fabricObj.evented = currentTool === 'select';
        
        // Enable controls for resizing
        fabricObj.set({
          hasControls: true,
          hasBorders: true,
          lockScalingX: false,
          lockScalingY: false,
          lockRotation: false,
          lockMovementX: false,
          lockMovementY: false,
          cornerSize: 10,
          transparentCorners: false,
          cornerColor: '#2563eb',
          cornerStrokeColor: '#1e40af',
          borderColor: '#2563eb',
          borderScaleFactor: 2,
        });
        
        // For Path and Polyline, explicitly show all corner controls
        if (fabricObj instanceof Path || fabricObj instanceof Polyline) {
          fabricObj.setControlsVisibility({
            tl: true,
            tr: true,
            bl: true,
            br: true,
            ml: true,
            mt: true,
            mr: true,
            mb: true,
            mtr: true,
          });
        }

        // For Textbox, prefer horizontal resizing (wrap width) and keep vertical scaling locked.
        if (fabricObj instanceof Textbox) {
          fabricObj.set({
            lockScalingY: true,
            lockUniScaling: false,
          } as any);
          fabricObj.setControlsVisibility({
            tl: false,
            tr: false,
            bl: false,
            br: false,
            ml: true,
            mr: true,
            mt: false,
            mb: false,
            mtr: true,
          });

          // Persist final text + styling when user finishes editing
          const id = shape.id;
          fabricObj.on('editing:exited', () => {
            useCanvasStore.getState().updateShape(id, {
              text: (fabricObj as any).text || '',
              width: (fabricObj as any).width || 0,
              fontSize: (fabricObj as any).fontSize || 32,
              fontFamily: (fabricObj as any).fontFamily || 'Arial',
              fontWeight: (fabricObj as any).fontWeight,
              fontStyle: (fabricObj as any).fontStyle,
              textAlign: (fabricObj as any).textAlign,
              fillColor: (fabricObj as any).fill,
              strokeColor: (fabricObj as any).stroke,
              strokeWidth: (fabricObj as any).strokeWidth,
              opacity: (fabricObj as any).opacity ?? 1,
            } as any);
          });
        }
        
        // Apply shadow if enabled
        if (shape.shadow && shape.shadow.enabled) {
          // Convert hex color to rgba with opacity
          const hexToRgba = (hex: string, opacity: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          };
          
          fabricObj.set({
            shadow: new fabric.Shadow({
              color: hexToRgba(shape.shadow.color, shape.shadow.opacity || 1),
              blur: shape.shadow.blur,
              offsetX: shape.shadow.offsetX,
              offsetY: shape.shadow.offsetY,
            }),
          });
        }
        
        canvas.add(fabricObj);
        
        // Remember object if it should be selected
        if (shape.id === selectedShapeId) {
          objectToSelect = fabricObj;
        }
      }
    }
    
    // Restore selection if there was one
    if (objectToSelect && currentTool === 'select') {
      canvas.setActiveObject(objectToSelect);
    }

    // If we just added a text shape, enter editing immediately.
    if (
      pendingTextEditId &&
      objectToSelect &&
      (objectToSelect as any).customId === pendingTextEditId &&
      objectToSelect instanceof Textbox &&
      currentTool === 'select'
    ) {
      try {
        objectToSelect.enterEditing();
        if (typeof (objectToSelect as any).selectAll === 'function') {
          (objectToSelect as any).selectAll();
        }
      } catch {
        // ignore: enterEditing can throw if canvas isn't ready
      } finally {
        useCanvasStore.getState().setPendingTextEditId(null);
      }
    }
    
    canvas.renderAll();
    };
    
    // Call the async function to add shapes
    addShapesToCanvas();
  }, [shapes, currentTool]);
  
  return (
    <div className="border-2 border-border rounded-lg overflow-hidden shadow-lg bg-card">
      <canvas ref={containerRef} />
    </div>
  );
}

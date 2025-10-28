export interface FigmaColor {
  r: number; g: number; b: number; a: number;
}

export interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  visible?: boolean;
  color?: FigmaColor;
  // ... other gradient/image properties
}

// --- Figma API Type Stub (simplified for relevant properties) ---



export interface FigmaVectorPath {
  data: string; // The d-attribute for SVG
  windingRule: string;
}

export interface FigmaVectorNode {
  id: string;
  name: string;
  type: "VECTOR" | "TEXT_PATH" | "HIGHLIGHT";
  absoluteBoundingBox: { x: number; y: number; width: number; height: number }; // For viewBox
  fills: FigmaPaint[];
  strokes: FigmaPaint[];
  strokeWeight: number;
  strokeCap: string;
  strokeJoin: 'MITER' | 'BEVEL' | 'ROUND';
  strokeDashes?: number[]; // Array of numbers e.g., [5, 5]
  opacity?: number;
  transform?: [[number, number, number], [number, number, number]]; // 2x3 matrix
  vectorPaths: FigmaVectorPath[];
  fillGeometry?: any[]; // Figma also provides this, but vectorPaths.data is often easier
}
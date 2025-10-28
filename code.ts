
 interface FigmaColor {
  r: number; g: number; b: number; a: number;
}

 interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  visible?: boolean;
  color?: FigmaColor;
  // ... other gradient/image properties
}

// --- Figma API Type Stub (simplified for relevant properties) ---



 interface FigmaVectorPath {
  data: string; // The d-attribute for SVG
  windingRule: string;
}

 interface FigmaVectorNode {
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

 function figmaRgbaToCssColor(color: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  // Figma's 'a' is 0-1, CSS rgba is also 0-1.
  const a = color.a;

  const toHex2 = (n: number) => {
    const s = n.toString(16);
    return s.length === 1 ? '0' + s : s;
  };

  if (a === 1) {
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  } else {
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
}



// Helper to convert Figma's strokeCap to SVG's stroke-linecap
 function figmaStrokeCapToSvg(cap: string): 'butt' | 'round' | 'square' {
  switch (cap) {
    case 'ROUND': return 'round';
    case 'SQUARE': return 'square';
    case 'NONE': return 'butt'; // Figma 'NONE' maps to SVG 'butt'
    default: return 'butt';
  }
}

// Helper to convert Figma's strokeJoin to SVG's stroke-linejoin
 function figmaStrokeJoinToSvg(join: 'MITER' | 'BEVEL' | 'ROUND'): 'miter' | 'bevel' | 'round' {
  switch (join) {
    case 'ROUND': return 'round';
    case 'BEVEL': return 'bevel';
    case 'MITER': return 'miter';
    default: return 'miter';
  }
}

 function figmaWindingRuleToSvg(rule: string): 'evenodd' | 'nonzero' {
  switch (rule) {
    case 'EVENODD': return 'evenodd';
    case 'NONZERO': return 'nonzero';
    default: return 'nonzero';
  }
}


 function convertFigmaVectorNodeToSVG(node: FigmaVectorNode): string {
  if (node.type !== 'VECTOR') {
    throw new Error(`Node must be of type 'VECTOR', received '${node.type}'`);
  }

  const svgElements: string[] = [];

  node.vectorPaths.forEach(vp => {
    const attrs: string[] = [];

    // --- Fill Attributes ---
    const solidFills = node.fills.filter(f => f.type === 'SOLID' && f.visible !== false);
    if (solidFills.length > 0) {
      const fill = solidFills[0];
      if (fill.color) {
        attrs.push(`fill="${figmaRgbaToCssColor(fill.color)}"`);
      } else {
        attrs.push(`fill="none"`);
      }
    } else {
      attrs.push(`fill="none"`);
    }

    attrs.push(`fillRule="${figmaWindingRuleToSvg(vp.windingRule)}"`);

    // --- Stroke Attributes ---
    const solidStrokes = node.strokes.filter(s => s.type === 'SOLID' && s.visible !== false);
    if (solidStrokes.length > 0) {
      const stroke = solidStrokes[0];
      if (stroke.color) {
        attrs.push(`stroke="${figmaRgbaToCssColor(stroke.color)}"`);
      }
      attrs.push(`strokeWidth="${node.strokeWeight}"`);
      attrs.push(`strokeLinecap="${figmaStrokeCapToSvg(node.strokeCap)}"`);
      attrs.push(`strokeLinejoin="${figmaStrokeJoinToSvg(node.strokeJoin)}"`);
      if (node.strokeDashes && node.strokeDashes.length > 0) {
        attrs.push(`strokeDasharray="${node.strokeDashes.join(' ')}"`);
      }
    } else {
      attrs.push(`stroke="none"`);
    }

    // --- Global Opacity ---
    if (node.opacity !== undefined && node.opacity !== 1) {
      attrs.push(`opacity="${node.opacity.toFixed(3)}"`);
    }


    svgElements.push(`<path d="${vp.data}" ${attrs.join(' ')}/>`);
  });

  const { x, y, width, height } = node.absoluteBoundingBox;
  const viewBox = `${x} ${y} ${width} ${height}`; // Figma's absoluteBoundingBox is useful here.
  // Often, you'd want the viewBox to start at 0 0
  // and offset the path within a <g> or adjust d-attribute.
  // This simple approach keeps the paths within their absolute positions.

  const contentTransform = `translate(${-x} ${-y})`;
  const finalSvgContent = svgElements.map(el => `<g >${el}</g>`).join('\n');


  return `<svg className='_${node.id.split(':').join('_').split(';').join('_')}'  width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${finalSvgContent}
</svg>`;
}


class cssData {


  async cssValue(node: any) {
    // return node
    return await node.getCSSAsync().then((data: any) => {
      return data
    })

  }

}

const cssDataClass = new cssData()


figma.codegen.on('generate', async (event: CodegenEvent) => {
  const node: SceneNode = event.node

  let cssStyle: {}[] = []

  const css = async (node: SceneNode) => {
    const { cssValue } = cssDataClass

    const childNodes: readonly SceneNode[] = 'children' in node ? (node.children as readonly SceneNode[]) : [];


    await cssValue(node).then((data) => {
      cssStyle.push(` ._${node.id.split(':').join('_').split(';').join('_')} ${JSON.stringify(data).split('",').join(';').split('"').join('')}
       `)

    })



    if (childNodes) {
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];

        await css(childNode)

      }

    }

    return cssStyle.join(' ')

  }

  const code = (node: SceneNode) => {



    const childNodes: readonly SceneNode[] = 'children' in node ? (node.children as readonly SceneNode[]) : [];
    const text = 'characters' in node ? node.characters : "";

    const padding = (position: keyof FrameNode) => position in node ? (node as any)[position] : 0;
    const textStyle = (key: keyof TextNode) => key in node ? (node as any)[key] : 0;
    const isInput = node.name.includes('input')
    const childProps = (key: keyof TextNode) => isInput && key in childNodes[0] ? (childNodes[0] as any)[key] : "";
    const isVector = 'vectorPaths' in node

    const solidStroke = isVector ? ((node as VectorNode).strokes[0] as SolidPaint).color : { r: 0, g: 0, b: 0 }
          console.log(node)

    if (isVector) {

      const nodeData: FigmaVectorNode = {
        id: node.id,
        name: node.name,
        type: node.type,
        absoluteBoundingBox: {
          height: node.absoluteBoundingBox?.height || 0,
          width: node.absoluteBoundingBox?.width || 0,
          x: node.absoluteBoundingBox?.x || 0,
          y: node.absoluteBoundingBox?.y || 0
        },
        fills: Array.isArray(node.fills) ? node.fills as FigmaPaint[] : [], // Semi-transparent blue
        strokes: (node.strokes as any[]).map(s => {
          // Ensure Solid paint color always has an alpha channel (default 1) so it matches FigmaColor
          if (s && s.type === 'SOLID' && s.color) {
            const c = s.color as any;
            const colorWithAlpha = { r: c.r, g: c.g, b: c.b, a: ('a' in c ? c.a : 1) };
            return { ...s, color: colorWithAlpha } as FigmaPaint;
          }
          return s as FigmaPaint;
        }),
        strokeWeight: Number(node.strokeWeight),
        strokeCap: node.strokeCap as StrokeCap,
        strokeJoin: node.strokeJoin as StrokeJoin,
        strokeDashes: 'strokeDashes' in node ? (node as any).strokeDashes : undefined, // 5px dash, 3px gap
        opacity: 1,
        vectorPaths: node.vectorPaths as VectorPath[]
      }
      return convertFigmaVectorNodeToSVG(nodeData)
    }
    else {
      return `  <${isInput ? `input` : `div`} ${isInput ? ` placeholder={'${childProps('characters')}'} type={'text'} ` : ''}  style={{
    width: CalResponsiveValue(${node.width}),
    height:CalResponsiveValue(${node.height}),
    paddingTop:CalResponsiveValue(${padding('paddingTop')}),
    paddingBottom:CalResponsiveValue(${padding('paddingBottom')}),
    paddingLeft:CalResponsiveValue(${padding('paddingLeft')}),
    paddingRight:CalResponsiveValue(${padding('paddingRight')}),
    gap:CalResponsiveValue(${padding('itemSpacing')}),
    fontSize:CalResponsiveValue(${isInput ? 16 : textStyle('fontSize')}),
    borderRadius:CalResponsiveValue(${padding('cornerRadius')}),
    color: ${isInput ? `'#fff'` : `''`}
    }} className='_${node.id.split(':').join('_').split(';').join('_')}' >
      ${childNodes && !isInput ? (childNodes.map((nodes): string => {
        return code(nodes)
      })) : ''
        } ${text} </${isInput ? `input` : `div`} >`
    }

  }






  return [
    {
      language: 'JAVASCRIPT',
      code: code(node).split('>,').join('>'),

      title: 'LazyDev HTML',
    },
    {
      language: 'JAVASCRIPT',
      code: (await css(node)),

      title: 'LazyDev HTML',
    },

  ];
});

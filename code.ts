
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
  type: NodeType;
  absoluteBoundingBox: {
    x: number,
    y: number,
    width: number,
    height: number
  }; // For viewBox
  fills: FigmaPaint[];
  strokes: any[];
  strokeWeight: number;
  strokeCap: StrokeCap;
  strokeJoin: StrokeJoin;
  strokeDashes?: number[]; // Array of numbers e.g., [5, 5]
  opacity?: number;
  transform?: [[number, number, number], [number, number, number]]; // 2x3 matrix
  vectorPaths: FigmaVectorPath[];
  fillGeometry?: any[]; // Figma also provides this, but vectorPaths.data is often easier
}

function figmaRgbaToCssColor(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  // Figma's 'a' is 0-1, CSS rgba is also 0-1.
  const a = color.a ?? 1

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


function convertFigmaVectorNodeToSVG(node: VectorNode): string {

  console.log(node, 'Vectorrr SVG')
  if (node.type !== 'VECTOR') {
    throw new Error(`Node must be of type 'VECTOR', received '${node.type}'`);
  }

  const svgElements: string[] = [];

  node.vectorPaths.forEach(vp => {
    const attrs: string[] = [];

    // --- Fill Attributes ---
    const solidFills = ((node).fills as SolidPaint[]).filter(f => f.type === 'SOLID' && f.visible !== false);
    const gradientFill = (((node).fills) as GradientPaint[]).filter(f => f.type === 'GRADIENT_LINEAR' && f.visible !== false)

    if (solidFills.length > 0) {
      const fill = solidFills[0];
      if (fill.color) {
        attrs.push(`fill="${figmaRgbaToCssColor(fill.color)}"`);
      } else {
        attrs.push(`fill="none"`);
      }
    }

    else {
      attrs.push(`fill="none"`);
    }

    attrs.push(`fillRule="${figmaWindingRuleToSvg(vp.windingRule)}"`);

    // --- Stroke Attributes ---
    const solidStrokes = node.strokes.filter(s => s.type === 'SOLID' && s.visible !== false);
    if (solidStrokes.length > 0) {
      const stroke = solidStrokes[0];
      if ((stroke as SolidPaint).color) {
        attrs.push(`stroke="${figmaRgbaToCssColor((stroke as SolidPaint).color)}"`);
      }
      attrs.push(`strokeWidth="${String(node.strokeWeight)}"`);
      attrs.push(`strokeLinecap="${figmaStrokeCapToSvg(String(node.strokeCap))}"`);
      attrs.push(`strokeLinejoin="${figmaStrokeJoinToSvg((node.strokeJoin) as StrokeJoin)}"`);

    } else {
      attrs.push(`stroke="none"`);
    }

    // --- Global Opacity ---
    if (node.opacity !== undefined && node.opacity !== 1) {
      attrs.push(`opacity="${node.opacity.toFixed(3)}"`);
    }


    svgElements.push(`<path d="${vp.data}" ${attrs.join(' ')}/>`);
  });

  const { x, y, width, height } = node.absoluteBoundingBox as { x: number, y: number, width: number, height: number }
  const viewBox = `${x} ${y} ${width} ${height}`; // Figma's absoluteBoundingBox is useful here.
  // Often, you'd want the viewBox to start at 0 0
  // and offset the path within a <g> or adjust d-attribute.
  // This simple approach keeps the paths within their absolute positions.

  const contentTransform = `translate(${-x} ${-y})`;
  const finalSvgContent = svgElements.map(el => `<g >${el}</g>`).join('\n');


  return `<svg  className='_${node.id.split(':').join('_').split(';').join('_')} absolute '  width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${svgElements.map(el => `<g  >${el}</g>`).join('\n')}
</svg>`;
}


class cssData {


  async cssValue(node: SceneNode) {
    // return node
    return await node.getCSSAsync().then((data: any) => {
      return data
    }).catch((err) => {
      console.log(err, 'errFrom class')
    })

  }

}

const cssDataClass = new cssData()

figma.codegen.on('generate', async (event: CodegenEvent) => {
  const node: SceneNode = event.node as SceneNode

  // If this node is a Component, it's safe to call getInstancesAsync
  // if (node.type === 'COMPONENT') {
  //   console.log(await (node as ComponentNode).getInstancesAsync());
  // }


  let cssStyle: {}[] = []

  const constantValue: string[] = []

  const css = async (node: SceneNode) => {
    const { cssValue } = cssDataClass

    const childNodes: readonly SceneNode[] = 'children' in node ? (node.children as readonly SceneNode[]) : [];


    await cssValue(node).then((data) => {
      cssStyle.push(` ._${node.id.split(':')?.join('_')?.split(';')?.join('_')} ${JSON.stringify(data)?.split('",')?.join(';')?.split('"')?.join('')}
       `)

    }).catch((err) => {
      console.log(err, 'from"cssValue')
    })



    if (childNodes) {

      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        // console.log(childNode.type,'from_css')


        await css(childNode as SceneNode).catch((err) => console.log(err < 'from_cssFunc'))



      }

    }

    return cssStyle.join(' ')

  }


  const code = (node: SceneNode) => {



    const childNodes: readonly SceneNode[] = 'children' in node ? (node.children as readonly SceneNode[]) : [];
    const text = 'characters' in node ? node.characters : "";

    const padding = (position: keyof FrameNode) => position in node ? String((node as any)[position]) : 0;
    const textStyle = (key: keyof TextNode) => key in node ? ((node as TextNode)[key]) : 0;
    const isInput = node.name.includes('input')
    const childProps = (key: keyof TextNode) => isInput && key in childNodes[0] ? (childNodes[0] as any)[key] : "";
    const isVector = 'vectorPaths' in node






    if (isVector) {



      return `<i> ${node.name}</i>`
    }
    else {




      return `  <${isInput ? `input` : node.type === 'TEXT' ? `p` : `div`} ${isInput ? ` placeholder={'${childProps('characters')}'} type={'text'} ` : ''}  style={{
    width: CalResponsiveValue(${node.width}),
    height:CalResponsiveValue(${node.height}),
    paddingTop:CalResponsiveValue(${padding('paddingTop')}),
    paddingBottom:CalResponsiveValue(${padding('paddingBottom')}),
    paddingLeft:CalResponsiveValue(${padding('paddingLeft')}),
    paddingRight:CalResponsiveValue(${padding('paddingRight')}),
    gap:CalResponsiveValue(${padding('itemSpacing')}),
    fontSize:CalResponsiveValue(${isInput ? 16 : typeof (textStyle('fontSize')) === 'number' ? String(textStyle('fontSize')) : 14}),
    borderTopLeftRadius:CalResponsiveValue(${(padding('topLeftRadius'))}),
    borderTopRightRadius:CalResponsiveValue(${(padding('topRightRadius'))}),
    borderBottomLeftRadius:CalResponsiveValue(${(padding('bottomLeftRadius'))}),
    borderBottomRightRadius:CalResponsiveValue(${(padding('bottomRightRadius'))}),



    color: ${isInput ? `'#fff'` : `''`}
    }} className='_${node.id.split(':').join('_').split(';').join('_')}   ' >
      ${childNodes && !isInput ? (childNodes.map((nodes): string => {
        return code(nodes)
      })) : ''
        } {${text.split(' ').join('_')}} </${isInput ? `input` : node.type === 'TEXT' ? `p` : `div`} >`
    }



  }

  const constValueFun = (node: SceneNode) => {
    const childNodes: readonly SceneNode[] = 'children' in node ? (node.children as readonly SceneNode[]) : [];

    const text = 'characters' in node ? node.characters : "";

    if (text.length > 0) {
      constantValue.push(text)


      return `${constantValue.map((val) => ` const ${val} = ${val} `)}`

    }
    if (childNodes) {
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        // console.log(childNode.type,'from_css')


        constValueFun(childNode as SceneNode)



      }
    }

    return `${constantValue.map((val) => ` const ${val.split(' ').join('_')} = ${val} `)}`.replace(',', ';')






  }



  const resFunction = `function CalResponsiveValue(value: number) {
    function CalPercent(value: number) {


    const isSmallScreen = window.innerWidth <= 1280
    const isNormalScreen = (window.innerWidth > 1280) && (window.innerWidth <= 1800)
    const isBigScreen = window.innerWidth > 1800


    const percent: number = isSmallScreen ? 110 : isNormalScreen ? 100 : isBigScreen ? 88 : 0;

    return (value / 1512) * percent

}
    const width = window.innerWidth;

    return (CalPercent(value) / 100) * width
}`





  return [
    {
      language: 'JAVASCRIPT',
      code: code(node)?.split('>,')?.join('>'),

      title: 'LazyDev HTML',
    },
    {
      language: 'JAVASCRIPT',
      code: (await css(node)),

      title: 'LazyDev CSS',
    },
    {
      language: 'JAVASCRIPT',
      code: (resFunction),

      title: 'LazyDev Function',
    },
    {
      language: 'JAVASCRIPT',
      code: constValueFun(node),
      title: 'LazyDev constantValue',
    }

  ];
});


export function figmaRgbaToCssColor(color: { r: number; g: number; b: number; a: number }): string {
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
export function figmaStrokeCapToSvg(cap:string): 'butt' | 'round' | 'square' {
    switch (cap) {
        case 'ROUND': return 'round';
        case 'SQUARE': return 'square';
        case 'NONE': return 'butt'; // Figma 'NONE' maps to SVG 'butt'
        default: return 'butt';
    }
}

// Helper to convert Figma's strokeJoin to SVG's stroke-linejoin
export function figmaStrokeJoinToSvg(join: 'MITER' | 'BEVEL' | 'ROUND'): 'miter' | 'bevel' | 'round' {
    switch (join) {
        case 'ROUND': return 'round';
        case 'BEVEL': return 'bevel';
        case 'MITER': return 'miter';
        default: return 'miter';
    }
}

export function figmaWindingRuleToSvg(rule: string): 'evenodd' | 'nonzero' {
    switch (rule) {
        case 'EVENODD': return 'evenodd';
        case 'NONZERO': return 'nonzero';
        default: return 'nonzero';
    }
}


export function convertFigmaVectorNodeToSVG(node: FigmaVectorNode): string {
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
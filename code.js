"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function figmaRgbaToCssColor(color) {
    var _a;
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    // Figma's 'a' is 0-1, CSS rgba is also 0-1.
    const a = (_a = color.a) !== null && _a !== void 0 ? _a : 1;
    const toHex2 = (n) => {
        const s = n.toString(16);
        return s.length === 1 ? '0' + s : s;
    };
    if (a === 1) {
        return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
    }
    else {
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
    }
}
// Helper to convert Figma's strokeCap to SVG's stroke-linecap
function figmaStrokeCapToSvg(cap) {
    switch (cap) {
        case 'ROUND': return 'round';
        case 'SQUARE': return 'square';
        case 'NONE': return 'butt'; // Figma 'NONE' maps to SVG 'butt'
        default: return 'butt';
    }
}
// Helper to convert Figma's strokeJoin to SVG's stroke-linejoin
function figmaStrokeJoinToSvg(join) {
    switch (join) {
        case 'ROUND': return 'round';
        case 'BEVEL': return 'bevel';
        case 'MITER': return 'miter';
        default: return 'miter';
    }
}
function figmaWindingRuleToSvg(rule) {
    switch (rule) {
        case 'EVENODD': return 'evenodd';
        case 'NONZERO': return 'nonzero';
        default: return 'nonzero';
    }
}
function convertFigmaVectorNodeToSVG(node) {
    console.log(node, 'Vectorrr SVG');
    if (node.type !== 'VECTOR') {
        throw new Error(`Node must be of type 'VECTOR', received '${node.type}'`);
    }
    const svgElements = [];
    node.vectorPaths.forEach(vp => {
        const attrs = [];
        // --- Fill Attributes ---
        const solidFills = (node).fills.filter(f => f.type === 'SOLID' && f.visible !== false);
        const gradientFill = ((node).fills).filter(f => f.type === 'GRADIENT_LINEAR' && f.visible !== false);
        if (solidFills.length > 0) {
            const fill = solidFills[0];
            if (fill.color) {
                attrs.push(`fill="${figmaRgbaToCssColor(fill.color)}"`);
            }
            else {
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
            if (stroke.color) {
                attrs.push(`stroke="${figmaRgbaToCssColor(stroke.color)}"`);
            }
            attrs.push(`strokeWidth="${String(node.strokeWeight)}"`);
            attrs.push(`strokeLinecap="${figmaStrokeCapToSvg(String(node.strokeCap))}"`);
            attrs.push(`strokeLinejoin="${figmaStrokeJoinToSvg((node.strokeJoin))}"`);
        }
        else {
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
    return `<svg  className='_${node.id.split(':').join('_').split(';').join('_')} absolute '  width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${svgElements.map(el => `<g  >${el}</g>`).join('\n')}
</svg>`;
}
class cssData {
    cssValue(node) {
        return __awaiter(this, void 0, void 0, function* () {
            // return node
            return yield node.getCSSAsync().then((data) => {
                return data;
            }).catch((err) => {
                console.log(err, 'errFrom class');
            });
        });
    }
}
const cssDataClass = new cssData();
figma.codegen.on('generate', (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const node = event.node;
    // If this node is a Component, it's safe to call getInstancesAsync
    // if (node.type === 'COMPONENT') {
    //   console.log(await (node as ComponentNode).getInstancesAsync());
    // }
    let cssStyle = [];
    const constantValue = [];
    const css = (node) => __awaiter(void 0, void 0, void 0, function* () {
        const { cssValue } = cssDataClass;
        const childNodes = 'children' in node ? node.children : [];
        yield cssValue(node).then((data) => {
            var _a, _b, _c, _d, _e, _f, _g;
            cssStyle.push(` ._${(_c = (_b = (_a = node.id.split(':')) === null || _a === void 0 ? void 0 : _a.join('_')) === null || _b === void 0 ? void 0 : _b.split(';')) === null || _c === void 0 ? void 0 : _c.join('_')} ${(_g = (_f = (_e = (_d = JSON.stringify(data)) === null || _d === void 0 ? void 0 : _d.split('",')) === null || _e === void 0 ? void 0 : _e.join(';')) === null || _f === void 0 ? void 0 : _f.split('"')) === null || _g === void 0 ? void 0 : _g.join('')}
       `);
        }).catch((err) => {
            console.log(err, 'from"cssValue');
        });
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                const childNode = childNodes[i];
                // console.log(childNode.type,'from_css')
                yield css(childNode).catch((err) => console.log(err < 'from_cssFunc'));
            }
        }
        return cssStyle.join(' ');
    });
    const code = (node) => {
        const childNodes = 'children' in node ? node.children : [];
        const text = 'characters' in node ? node.characters : "";
        const padding = (position) => position in node ? String(node[position]) : '0';
        const textStyle = (key) => key in node ? (node[key]) : 0;
        const isInput = node.name.includes('input');
        const childProps = (key) => isInput && key in childNodes[0] ? childNodes[0][key] : "";
        const isVector = 'vectorPaths' in node;
        const cssPropsArr = [
            {
                type: 'paddingTop',
                position: 'paddingTop'
            },
            {
                type: 'paddingBottom',
                position: 'paddingBottom'
            },
            {
                type: 'paddingLeft',
                position: 'paddingLeft'
            },
            {
                type: 'paddingRight',
                position: 'paddingRight'
            },
            {
                type: 'borderTopLeftRadius',
                position: 'topLeftRadius'
            },
            {
                type: 'borderTopRightRadius',
                position: 'topRightRadius'
            },
            {
                type: 'borderBottomLeftRadius',
                position: 'bottomLeftRadius'
            },
            {
                type: 'gap',
                position: 'itemSpacing'
            },
        ];
        function CssProps(type, position) {
            if (padding(`${position}`) !== '0') {
                return `${type}: CalResponsiveValue(${padding(`${position}`)}),
    `;
            }
            else {
                return ``;
            }
        }
        if (isVector) {
            return `<i> ${node.name}</i>`;
        }
        else {
            return `  <${isInput ? `input` : node.type === 'TEXT' ? `p` : `div`} ${isInput ? ` placeholder={'${childProps('characters')}'} type={'text'} ` : ''}  style={{
    width: CalResponsiveValue(${node.width}),
    height:CalResponsiveValue(${node.height}),
    fontSize:CalResponsiveValue(${isInput ? 16 : typeof (textStyle('fontSize')) === 'number' ? String(textStyle('fontSize')) : 14}),
    ${cssPropsArr.map((value) => CssProps(value.type, value.position)).join('')}
    color: ${isInput ? `'#fff'` : `''`}
    }}
    className='_${node.id.split(':').join('_').split(';').join('_')}   ' >
      ${childNodes && !isInput ? (childNodes.map((nodes) => {
                return code(nodes);
            })) : ''} {${text.split(' ').join('_')}} </${isInput ? `input` : node.type === 'TEXT' ? `p` : `div`} >`;
        }
    };
    const constValueFun = (node) => {
        const childNodes = 'children' in node ? node.children : [];
        const text = 'characters' in node ? node.characters : "";
        if (text.length > 0) {
            constantValue.push(text);
            return `${constantValue.map((val) => ` const ${val} = ${val} `)}`;
        }
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                const childNode = childNodes[i];
                // console.log(childNode.type,'from_css')
                constValueFun(childNode);
            }
        }
        return `${constantValue.map((val) => ` const val_${(val.length > 10 ? val.slice(0, 10) : val).split(' ').join('_').split(":").join('').split("#").join('')} = "${val}" `)}`.replace(',', ';');
    };
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
}`;
    return [
        {
            language: 'JAVASCRIPT',
            code: (_b = (_a = code(node)) === null || _a === void 0 ? void 0 : _a.split('>,')) === null || _b === void 0 ? void 0 : _b.join('>'),
            title: 'LazyDev HTML',
        },
        {
            language: 'JAVASCRIPT',
            code: (yield css(node)),
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
}));

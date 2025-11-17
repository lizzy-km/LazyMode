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
    const node = event.node;
    // If this node is a Component, it's safe to call getInstancesAsync
    // if (node.type === 'COMPONENT') {
    //   console.log(await (node as ComponentNode).getInstancesAsync());
    // }
    let cssStyle = [];
    let childNodesList = [];
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
        let count = 0;
        function calculateNestedChildCount(nodes) {
            const childNodes = 'children' in nodes ? nodes.children : [];
            // 1. Loop through each item in the current level's array
            for (const nodeL of childNodes) {
                // 2. Increment the count for the current node
                count += 1;
                // 3. Check for the nested array and recurse
                if (Array.isArray(nodeL.children) && nodeL.children.length > 0) {
                    // Add the result of the recursive call to the total count
                    count += calculateNestedChildCount(nodeL.children);
                }
            }
            return count;
        }
        if (isVector) {
            return `<pre> icon </pre>`;
        }
        else {
            return `  
      // ${node.name}
  <${isInput ? `input` : node.type === 'TEXT' ? `p` : `div`} ${isInput ? ` placeholder={'${childProps('characters')}'} type={'text'} ` : ''}  style={{
    width: CalResponsiveValue(${node.width}),
    height:CalResponsiveValue(${node.height}),${textStyle('fontSize') > 0 ? `    
    fontSize:CalResponsiveValue(${isInput ? 16 : typeof (textStyle('fontSize')) === 'number' ? String(textStyle('fontSize')) : 14}),
` : ``}
    ${cssPropsArr.map((value) => CssProps(value.type, value.position)).join('')}
    color: ${isInput ? `'#fff'` : `''`},${node.name.includes('button') ? `
    cursor:'pointer'` : ``}
    }}
    className='_${node.id.split(':').join('_').split(';').join('_')}     ' >
      ${childNodes && !isInput ? (childNodes.map((nodes) => {
                console.log(calculateNestedChildCount(nodes));
                console.log(nodes);
                // if(calculateNestedChildCount(nodes ) > 20){
                //   return `
                //   childrenList.map(())
                //   `
                // }
                return `  
            ${code(nodes)}`;
            })) : ''} ${text.length > 0 ? text : ''}  </${isInput ? `input` : node.type === 'TEXT' ? `p` : `div`} >`;
        }
    };
    const resFunction = `
  function CalResponsiveValue(value: number) {

    function CalPercent(value: number) {

    const isSmallScreen = window.innerWidth <= 1280
    const isNormalScreen = (window.innerWidth > 1280) && (window.innerWidth <= 1800)
    const isBigScreen = window.innerWidth > 1800

    const percent: number = isSmallScreen ? 110 : isNormalScreen ? 100 : isBigScreen ? 88 : 0;
    const baseScreenWidth:number = 1512 

    return (value / baseScreenWidth) * percent

}

    const width = window.innerWidth;

    return (CalPercent(value) / 100) * width
}`;
    return [
        {
            language: 'CSS',
            code: yield css(node),
            title: 'LazyDev External CSS',
        },
        {
            language: 'JAVASCRIPT',
            code: (yield css(node).then((cssData) => {
                var _a, _b;
                return `
export function Component (){
          ${resFunction}

          return (
          ${(_b = (_a = code(node)) === null || _a === void 0 ? void 0 : _a.split('>,')) === null || _b === void 0 ? void 0 : _b.join('>')}
)
  }
        `;
            })),
            title: 'LazyDev React Component',
        }
    ];
}));

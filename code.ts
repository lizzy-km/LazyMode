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

  let childNodesList = []

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

    const padding = (position: keyof FrameNode) => position in node ? String((node as any)[position]) : '0';
    const textStyle = (key: keyof TextNode) => key in node ? ((node as TextNode)[key]) : 0;
    const isInput = node.name.includes('input')
    const childProps = (key: keyof TextNode) => isInput && key in childNodes[0] ? (childNodes[0] as any)[key] : "";
    const isVector = 'vectorPaths' in node


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

    ]


    function CssProps(type: string, position: string): string {
      if (padding(`${position}` as keyof FrameNode) !== '0') {
        return `${type}: CalResponsiveValue(${padding(`${position}` as keyof FrameNode)}),
    `
      } else {
        return ``
      }


    }


    if (isVector) {



      return `<pre> icon </pre>`
    }
    else {

      return `  
      // ${node.name}
  <${isInput ? `input` : node.type === 'TEXT' ? `p` : `div`} ${isInput ? ` placeholder={'${childProps('characters')}'} type={'text'} ` : ''}  style={{
    width: CalResponsiveValue(${node.width}),
    height:CalResponsiveValue(${node.height}),${textStyle('fontSize')??0 as number > 0 ? `    
    fontSize:CalResponsiveValue(${isInput ? 16 : typeof (textStyle('fontSize')) === 'number' ? String(textStyle('fontSize')) : 14}),
`: ``}
    ${cssPropsArr.map((value) => CssProps(value.type, value.position)).join('')}
    color: ${isInput ? `'#fff'` : `''`},${node.name.includes('button') ? `
    cursor:'pointer'`: ``}
    }}
    className='_${node.id.split(':').join('_').split(';').join('_')}     ' >
      ${childNodes && !isInput ? (childNodes.map((nodes): string => {

        return `  
            ${code(nodes)}`
      })) : ''
        } ${text.length > 0 ? text : ''}  </${isInput ? `input` : node.type === 'TEXT' ? `p` : `div`} >`
    }


  }


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
}`

  return [
    {
      language: 'CSS',
      code: await css(node),

      title: 'LazyDev External CSS',
    },
    {
      language: 'JAVASCRIPT',
      code: (await css(node).then((cssData) => {
        return `
export function Component (){
          ${resFunction}

          return (
          ${code(node)?.split('>,')?.join('>')}
)
  }
        `
      })),

      title: 'LazyDev React Component',
    }


  ];
});

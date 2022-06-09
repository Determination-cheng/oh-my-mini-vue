import { NodeTypes } from './ast'

type ChildrenType = {
  type: number
  tag?: string
  content?:
    | {
        type: number
        content: string
      }
    | string
}

type ElementType = {
  type: number
  tag: string
  children?: ChildrenType[]
}

type ContextType = ReturnType<typeof createParserContext>

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context, ''))
}

function parseChildren(
  context: ContextType,
  parentTag: string,
): ChildrenType[] {
  const nodes: ChildrenType[] = []

  while (!isEnd(context, parentTag)) {
    let node: ChildrenType | undefined
    const s = context.source

    if (s.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (s.startsWith('<')) {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context)
      }
    }

    if (!node) {
      node = parseText(context)
    }

    nodes.push(node!)
  }

  return nodes
}

function isEnd(context: ContextType, parentTag: string) {
  // 遇到结束标签时结束
  const s = context.source
  if (parentTag && s.startsWith(`</${parentTag}`)) {
    context.source = context.source.replace(`</${parentTag}>`, '')
    return true
  }

  // 当没有值的时候结束
  return !context.source
}

function createRoot(children: ChildrenType[]) {
  return { children }
}

function createParserContext(content: string) {
  return { source: content }
}

//* 解析插值
function parseInterpolation(context: ContextType) {
  // {{message}}
  const DelimiterStart = '{{'
  const DelimiterEnd = '}}'

  const content = parseContextByDelimiter(context, DelimiterStart, DelimiterEnd)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESS,
      content,
    },
  }
}

//* 解析元素
function parseElement(context: ContextType) {
  const element = parseTag(context) as ElementType
  element.children = parseChildren(context, element.tag)

  return element
}

//* 解析文本
function parseText(context: ContextType) {
  let endIndex = context.source.length
  let endTokens = ['</', '{{']

  endTokens.forEach(endToken => {
    const index = context.source.indexOf(endToken)
    if (index !== -1 && index < endIndex) {
      endIndex = index
    }
  })

  const content = parseContextByLength(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content,
  }
}

function getContent(
  context: ContextType,
  DelimiterStart: string,
  DelimiterEnd: string,
) {
  const closeIndex = context.source.indexOf(DelimiterEnd, DelimiterStart.length)
  const content = context.source.slice(DelimiterStart.length, closeIndex).trim()

  return content
}

function parseTag(context: ContextType, length?: number) {
  // 解析 tag
  const match = /^<\/?([a-z]+)/i.exec(context.source)
  const tag = match?.[1]

  // 删除处理完成的代码
  advanceByDelimiter(context, '<', '>') // 删除开始标签
  // advanceByDelimiter(context, '<', '>') // 删除结束标签
  if (typeof length === 'number') {
    advanceByDelimiter(context, '<', '>') // 删除结束标签
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
  }
}

function parseContextByDelimiter(
  context: ContextType,
  DelimiterStart: string,
  DelimiterEnd: string,
) {
  const content = getContent(context, DelimiterStart, DelimiterEnd)
  advanceByDelimiter(context, DelimiterStart, DelimiterEnd)

  return content
}

function parseContextByLength(context: ContextType, length: number) {
  // 1.截取
  const content = context.source.slice(0, length)

  // 2.推进
  advanceByLength(context, content.length)

  return content
}

function advanceByDelimiter(
  context: ContextType,
  DelimiterStart: string,
  DelimiterEnd: string,
) {
  const closeIndex = context.source.indexOf(DelimiterEnd, DelimiterStart.length)
  context.source = context.source.slice(closeIndex + DelimiterEnd.length)
}

function advanceByLength(context: ContextType, length: number) {
  context.source = context.source.slice(length)
}

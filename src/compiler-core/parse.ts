import { NodeTypes } from './ast'

type ChildrenType = {
  type: number
  tag?: string
  content?: {
    type: number
    content: string
  }
}

type ContextType = ReturnType<typeof createParserContext>

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context))
}

function parseChildren(context: ContextType): ChildrenType[] {
  const nodes: ChildrenType[] = []
  let node: ChildrenType
  const s = context.source

  if (s.startsWith('{{')) {
    node = parseInterpolation(context)
  } else if (s.startsWith('<')) {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context)
    }
  }
  nodes.push(node!)

  return nodes
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

  const content = getContent(context, DelimiterStart, DelimiterEnd)
  advanceBy(context, DelimiterStart, DelimiterEnd)

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
  // 解析 tag
  const match = /^<\/?([a-z]+)/i.exec(context.source)
  const tag = match?.[1]

  // 删除处理完成的代码
  advanceBy(context, '<', '>') // 删除开始标签
  advanceBy(context, '<', '>') // 删除结束标签

  return {
    type: NodeTypes.ELEMENT,
    tag,
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

function advanceBy(
  context: ContextType,
  DelimiterStart: string,
  DelimiterEnd: string,
) {
  const closeIndex = context.source.indexOf(DelimiterEnd, DelimiterStart.length)
  context.source = context.source.slice(closeIndex + DelimiterEnd.length)
}

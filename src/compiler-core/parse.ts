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

type ContextType = ReturnType<typeof createParserContext>

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context))
}

function parseChildren(context: ContextType): ChildrenType[] {
  const nodes: ChildrenType[] = []
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
  const tag = parseTag(context)

  return {
    type: NodeTypes.ELEMENT,
    tag,
  }
}

//* 解析文本
function parseText(context: ContextType) {
  const content = parseContextByLength(context)

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

function parseTag(context: ContextType) {
  // 解析 tag
  const match = /^<\/?([a-z]+)/i.exec(context.source)
  const tag = match?.[1]

  // 删除处理完成的代码
  advanceByDelimiter(context, '<', '>') // 删除开始标签
  advanceByDelimiter(context, '<', '>') // 删除结束标签

  return tag
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

function parseContextByLength(context: ContextType) {
  // 1.截取
  const content = context.source.slice(0, context.source.length)

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

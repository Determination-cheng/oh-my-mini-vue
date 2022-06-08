import { NodeTypes } from './ast'

type ChildrenType = {
  type: number
  content: {
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

  if (context.source.startsWith('{{')) {
    node = parseInterpolation(context)
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

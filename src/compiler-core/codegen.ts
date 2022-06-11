import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from './runtimeHelpers'
import type { ContextType, NodeType } from './transform'

export function generate(ast: NodeType) {
  const context = createCodegenContext()
  const { push } = context

  getFunctionPreamble(ast, context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}) {`)
  push('return ')
  genNode(ast.codeGenNode, context)
  push('}')

  return { code: context.code }
}

function getFunctionPreamble(
  ast: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push } = context
  const VueBinging = 'Vue'
  const aliasHelper = (s: keyof typeof helperMapName) =>
    `${helperMapName[s]}: _${helperMapName[s]}`
  if (ast.helpers?.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)
  }
  push('\n')
  push('return ')
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source: string) {
      context.code += source
    },
    helper(key: keyof typeof helperMapName) {
      return `_${helperMapName[key]}`
    },
  }
  return context
}

function genNode(
  node: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESS:
      genExpression(node, context)
      break
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break
  }
}

function genElement(
  node: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push, helper } = context
  const { tag } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}")`)
}

function genText(
  node: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push } = context
  push(`'${node?.content}'`)
}

function genInterpolation(
  node: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push, helper } = context

  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')
}

function genExpression(
  node: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push } = context
  push(node.content)
}

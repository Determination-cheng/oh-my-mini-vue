import { isString } from '../utils'
import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from './runtimeHelpers'
import type { NodeType } from './transform'

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
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
  }
}

function genCompoundExpression(
  node: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push } = context
  const { children } = node
  for (let i = 0; i < children!.length; i++) {
    const child = children![i]
    if (isString(child)) {
      push(child)
    } else {
      genNode(child, context)
    }
  }
}

function genElement(
  node: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push, helper } = context
  const { tag, children, props } = node

  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  // genNode(children as any, context)
  genNodeList(genNullable([tag, props, children]), context)
  push(')')
}

function genNodeList(
  nodes: any[],
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push } = context

  nodes.forEach((node, i) => {
    if (isString(node)) {
      push(node)
    } else {
      genNode(node, context)
    }

    if (i < nodes.length - 1) {
      push(', ')
    }
  })
}

function genNullable(args: any[]) {
  return args.map(arg => arg ?? 'null')
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

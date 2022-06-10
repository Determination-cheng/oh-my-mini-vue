import type { NodeType } from './transform'

export function generate(ast: NodeType) {
  const context = createCodegenContext()
  const { push } = context
  push('return ')

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}) {`)
  push('return ')
  genNode(ast.codeGenNode, context)
  push('}')

  return { code: context.code }
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source: string) {
      context.code += source
    },
  }
  return context
}

function genNode(
  node: NodeType,
  context: ReturnType<typeof createCodegenContext>,
) {
  const { push } = context
  push(`return '${node?.content}'`)
}

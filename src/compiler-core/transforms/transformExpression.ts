import { NodeTypes } from '../ast'
import { NodeType } from '../transform'

export function transformExpression(node: NodeType) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content)
  }
}

function processExpression(node: NodeType['content']) {
  node.content = `_ctx.${node.content}`
  return node
}

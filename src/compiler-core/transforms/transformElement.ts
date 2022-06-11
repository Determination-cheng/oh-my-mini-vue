import { NodeTypes } from '../ast'
import { CREATE_ELEMENT_VNODE } from '../runtimeHelpers'
import { ContextType, NodeType } from '../transform'

export function transformElement(node: NodeType, context: ContextType) {
  if (node.type === NodeTypes.ELEMENT) {
    context.helper(CREATE_ELEMENT_VNODE)
  }
}

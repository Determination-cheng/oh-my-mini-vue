import { createVnodeCall, NodeTypes } from '../ast'
import { ContextType, NodeType } from '../transform'

export function transformElement(node: NodeType, context: ContextType) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // tag
      const vnodeTag = `"${node.tag}"`

      // props
      let vnodeProps

      // children
      const { children } = node
      let vnodeChildren = children![0]

      node.codeGenNode = createVnodeCall(
        vnodeTag,
        vnodeProps,
        vnodeChildren,
        context,
      )
    }
  }
}

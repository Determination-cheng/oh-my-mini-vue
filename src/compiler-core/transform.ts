import { NodeTypes } from './ast'
import type { ChildrenType } from './parse'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export type NodeType =
  | (ChildrenType & { codeGenNode?: any; helpers?: any })
  | {
      children: ChildrenType[]
      type?: number
      content?: any
      codeGenNode?: any
      helpers?: any
    }

type Options = { nodeTransforms?: Array<(node: NodeType) => void> }

export function transform(root: NodeType, options?: Options) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  createRootCodeGen(root)

  root.helpers = [...context.helpers.keys()]
}

function createRootCodeGen(root: NodeType) {
  return (root.codeGenNode = root.children?.[0])
}

function createTransformContext(root: NodeType, options?: Options) {
  const context = {
    root,
    nodeTransforms: options?.nodeTransforms ?? [],
    helpers: new Map(),
    helper(key: Symbol) {
      context.helpers.set(key, 1)
    },
  }

  return context
}

function traverseNode(
  node: NodeType,
  context: ReturnType<typeof createTransformContext>,
) {
  const nodeTransforms = context.nodeTransforms

  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
      break
  }
}

function traverseChildren(
  node: NodeType,
  context: ReturnType<typeof createTransformContext>,
) {
  const children = node.children

  for (let i = 0; i < children!.length; i++) {
    const node = children![i]
    traverseNode(node, context)
  }
}

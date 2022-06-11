import { CREATE_ELEMENT_VNODE } from './runtimeHelpers'

export const enum NodeTypes {
  INTERPOLATION,
  SIMPLE_EXPRESS,
  ELEMENT,
  TEXT,
  ROOT,
  COMPOUND_EXPRESSION,
}

export function createVnodeCall(
  tag: string,
  props: any,
  children: any,
  context: any,
) {
  context.helper(CREATE_ELEMENT_VNODE)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  }
}

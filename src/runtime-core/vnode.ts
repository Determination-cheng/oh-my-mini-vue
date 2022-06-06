import { ShapeFlags } from '../utils'

export type SetupResult = (() => any) | Record<keyof any, any>

export type ComponentType = {
  setup(
    props: Record<string, any>,
    tools: { emit: (event: string) => void },
  ): SetupResult
  render?: () => VnodeType
}

export type VnodeType = {
  type: ComponentType | string | Symbol
  props?: Record<string, any>
  children?: VnodeType[] | string | Record<string, any>
  el: HTMLElement | Text | null
  shapeFlag: number
  key: string | undefined
}

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export function createVNode(
  type: VnodeType['type'],
  props?: VnodeType['props'],
  children?: VnodeType['children'],
): VnodeType {
  const vnode = {
    type,
    props,
    children,
    el: null,
    shapeFlag: getShapeFlag(type),
    key: props?.key,
  }

  // children
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  return vnode
}

export function createTextVnode(text: string) {
  return createVNode(Text, {}, text)
}

function getShapeFlag(type: VnodeType['type']) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}

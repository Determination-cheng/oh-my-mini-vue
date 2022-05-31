import { ShapeFlags } from '../utils'

export type SetupResult = (() => any) | Record<keyof any, any>

export type ComponentType = {
  setup(): SetupResult
  render?: () => VnodeType
}

export type VnodeType = {
  type: ComponentType | string
  props?: Record<string, any>
  children?: VnodeType[] | string
  el: HTMLElement | null
  shapeFlag: number
}

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
  }

  // children
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.STATEFUL_COMPONENT
  }

  return vnode
}

function getShapeFlag(type: VnodeType['type']) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}

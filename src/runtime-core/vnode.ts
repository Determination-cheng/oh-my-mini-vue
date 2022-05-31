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
}

export function createVNode(
  type: VnodeType['type'],
  props?: VnodeType['props'],
  children?: VnodeType['children'],
): VnodeType {
  const vnode = { type, props, children, el: null }
  return vnode
}

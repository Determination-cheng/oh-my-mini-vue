export type SetupResult = (() => any) | Record<keyof any, any>

export type VnodeType = {
  type: {
    setup(): SetupResult
    render?: () => VnodeType
  }
  props?: Record<string, unknown>
  children?: VnodeType[]
}

export function createVNode(
  type: VnodeType['type'],
  props?: VnodeType['props'],
  children?: VnodeType['children'],
): VnodeType {
  const vnode = { type, props, children }
  return vnode
}

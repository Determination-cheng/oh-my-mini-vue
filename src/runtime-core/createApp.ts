import { render } from './renderer'
import { createVNode } from './vnode'
import type { VnodeType } from './vnode'

export function createApp(rootComponent: VnodeType['type']) {
  return {
    mount(rootContainer: HTMLDivElement) {
      // 先转换成 vnode，后续操作都会基于 vnode
      const vnode = createVNode(rootComponent)

      render(vnode, rootContainer)
    },
  }
}

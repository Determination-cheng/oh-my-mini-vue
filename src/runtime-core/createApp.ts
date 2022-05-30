import { render } from './renderer'
import { createVNode } from './vnode'
import type { VnodeType } from './vnode'

export function createApp(rootComponent: VnodeType['type']) {
  return {
    mount(rootContainer: HTMLDivElement | string) {
      // 先转换成 vnode，后续操作都会基于 vnode
      const vnode = createVNode(rootComponent)

      const _rootContainer =
        typeof rootContainer === 'string'
          ? (document.getElementById(rootContainer) as HTMLDivElement)
          : rootContainer

      render(vnode, _rootContainer)
    },
  }
}

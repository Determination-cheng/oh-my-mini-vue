import { createComponentInstance, setupComponent } from './component'
import type { VnodeType } from './vnode'
import type { ComponentInstance } from './component'

export function render(vnode: VnodeType, container: HTMLDivElement) {
  // patch
  patch(vnode, container)
}

function patch(vnode: VnodeType, container: HTMLDivElement) {
  // 处理 vue 组件
  processComponent(vnode, container)

  // 处理原生元素
  // processElement
}

//* 处理原生元素
function processElement() {}

//* 处理 vue 组件
function processComponent(vnode: VnodeType, container: HTMLDivElement) {
  // 挂载组件
  mountComponent(vnode, container)
}

function mountComponent(vnode: VnodeType, container: HTMLDivElement) {
  const instance = createComponentInstance(vnode)

  setupComponent(instance)

  setupRenderEffect(instance, container)
}

function setupRenderEffect(
  instance: ComponentInstance,
  container: HTMLDivElement,
) {
  // vnode tree
  const subtree = instance.render!()

  // 根据 subtree 再调用 patch
  // vnode -> element -> mountElement
  patch(subtree, container)
}

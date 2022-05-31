import { createComponentInstance, setupComponent } from './component'
import type { VnodeType } from './vnode'
import type { ComponentInstance } from './component'
import { isObject } from '../utils'

export function render(vnode: VnodeType, container: HTMLElement) {
  // patch
  patch(vnode, container)
}

function patch(vnode: VnodeType, container: HTMLElement) {
  if (typeof vnode.type === 'string') {
    // 处理原生元素
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
    // 处理 vue 组件
    processComponent(vnode, container)
  }
}

//* 处理原生元素
function processElement(vnode: VnodeType, container: HTMLElement) {
  mountElement(vnode, container)
}

function mountElement(vnode: VnodeType, container: HTMLElement) {
  const el = document.createElement(vnode.type as string)

  // 设置子节点
  // string array
  const { children } = vnode
  if (typeof children === 'string') {
    el.textContent = children as string
  } else if (Array.isArray(children)) {
    children.forEach(child => patch(child, el))
  }

  // 设置属性 props
  const { props } = vnode
  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      const val = props[key]
      el.setAttribute(key, val)
    }
  }

  container.append(el)
}

//* 处理 vue 组件
function processComponent(vnode: VnodeType, container: HTMLElement) {
  // 挂载组件
  mountComponent(vnode, container)
}

function mountComponent(vnode: VnodeType, container: HTMLElement) {
  const instance = createComponentInstance(vnode)

  setupComponent(instance)

  setupRenderEffect(instance, container)
}

function setupRenderEffect(
  instance: ComponentInstance,
  container: HTMLElement,
) {
  const { proxy } = instance
  // vnode tree
  const subtree = instance.render!.call(proxy)

  // 根据 subtree 再调用 patch
  // vnode -> element -> mountElement
  patch(subtree, container)
}

import { createComponentInstance, setupComponent } from './component'
import { ShapeFlags, isEvent } from '../utils'
import { Fragment } from './vnode'
import type { VnodeType } from './vnode'
import type { ComponentInstance } from './component'

export function render(vnode: VnodeType, container: HTMLElement) {
  // patch
  patch(vnode, container)
}

function patch(vnode: VnodeType, container: HTMLElement) {
  const { shapeFlag, type } = vnode

  switch (type) {
    case Fragment:
      processFragment(vnode, container)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理原生元素
        processElement(vnode, container)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理 vue 组件
        processComponent(vnode, container)
      }
  }
}

//* Fragment
function processFragment(vnode: VnodeType, container: HTMLElement) {
  mountChildren(vnode.children as VnodeType[], container)
}

//* 处理原生元素
function processElement(vnode: VnodeType, container: HTMLElement) {
  mountElement(vnode, container)
}

function mountElement(vnode: VnodeType, container: HTMLElement) {
  const el = (vnode.el = document.createElement(vnode.type as string))

  // 设置子节点
  // string array
  const { children } = vnode
  if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children as string
  } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // ;(children as VnodeType[]).forEach(child => patch(child, el))
    mountChildren(vnode.children as VnodeType[], el)
  }

  // 设置属性 props
  const { props } = vnode
  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      const val = props[key]

      if (isEvent(key)) {
        const event = key.slice(2).toLocaleLowerCase()
        el.addEventListener(event, val)
      } else {
        el.setAttribute(key, val)
      }
    }
  }

  container.append(el)
}

function mountChildren(children: VnodeType[], container: HTMLElement) {
  children.forEach(child => patch(child, container))
}

//* 处理 vue 组件
function processComponent(vnode: VnodeType, container: HTMLElement) {
  // 挂载组件
  mountComponent(vnode, container)
}

function mountComponent(vnode: VnodeType, container: HTMLElement) {
  const instance = createComponentInstance(vnode)

  setupComponent(instance)

  setupRenderEffect(instance, vnode, container)
}

function setupRenderEffect(
  instance: ComponentInstance,
  vnode: VnodeType,
  container: HTMLElement,
) {
  const { proxy } = instance
  // vnode tree
  const subtree = instance.render!.call(proxy)

  // 根据 subtree 再调用 patch
  // vnode -> element -> mountElement
  patch(subtree, container)

  vnode.el = subtree.el
}

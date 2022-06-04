import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { ShapeFlags } from '../utils'
import { Fragment, Text } from './vnode'
import type { VnodeType } from './vnode'
import type { ComponentInstance } from './component'

type RendererOptions = {
  createElement(type: VnodeType['type']): HTMLElement | any
  patchProps(el: any, key: string, val: any): void
  insert(el: any, container: any): void
}

export function createRenderer(options: RendererOptions) {
  const { createElement, patchProps, insert } = options

  function render(vnode: VnodeType, container: HTMLElement) {
    // patch
    patch(vnode, container, null)
  }

  function patch(
    vnode: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    const { shapeFlag, type } = vnode

    switch (type) {
      case Fragment:
        processFragment(vnode, container, parent)
        break
      case Text:
        processText(vnode, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理原生元素
          processElement(vnode, container, parent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理 vue 组件
          processComponent(vnode, container, parent)
        }
    }
  }

  //* Fragment
  function processFragment(
    vnode: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    mountChildren(vnode.children as VnodeType[], container, parent)
  }

  //* Text
  function processText(vnode: VnodeType, container: HTMLElement) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children as string))
    container.append(textNode)
  }

  //* 处理原生元素
  function processElement(
    vnode: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    mountElement(vnode, container, parent)
  }

  function mountElement(
    vnode: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    //* 创建元素
    const el = createElement(vnode.type)

    // 设置子节点
    // string array
    const { children } = vnode
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children as string
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children as VnodeType[], el, parent)
    }

    // 设置属性 props
    const { props } = vnode
    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        const val = props[key]

        //* 处理属性
        patchProps(el, key, val)
      }
    }

    //* 将当前元素添加到容器上
    insert(el, container)
  }

  function mountChildren(
    children: VnodeType[],
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    children.forEach(child => patch(child, container, parent))
  }

  //* 处理 vue 组件
  function processComponent(
    vnode: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    // 挂载组件
    mountComponent(vnode, container, parent)
  }

  function mountComponent(
    vnode: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    const instance = createComponentInstance(vnode, parent)

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
    patch(subtree, container, instance)

    vnode.el = subtree.el
  }

  return {
    createApp: createAppAPI(render),
  }
}

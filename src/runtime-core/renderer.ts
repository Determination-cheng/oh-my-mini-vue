import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { EMPTY_OBJECT, ShapeFlags } from '../utils'
import { Fragment, Text } from './vnode'
import type { VnodeType } from './vnode'
import type { ComponentInstance } from './component'
import { effect } from '../reactivity'

type RendererOptions = {
  createElement(type: VnodeType['type']): HTMLElement | any
  patchProps(el: any, key: string, prevProp: any, nextProp: any): void
  insert(el: any, container: any): void
}

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
  } = options

  function render(vnode: VnodeType, container: HTMLElement) {
    // patch
    patch(null, vnode, container, null)
  }

  function patch(
    n1: VnodeType | null, // old
    n2: VnodeType, // new
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    const { shapeFlag, type } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parent)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理原生元素
          processElement(n1, n2, container, parent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理 vue 组件
          processComponent(n1, n2, container, parent)
        }
    }
  }

  //* Fragment
  function processFragment(
    n1: VnodeType | null,
    n2: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    mountChildren(n2.children as VnodeType[], container, parent)
  }

  //* Text
  function processText(
    n1: VnodeType | null,
    n2: VnodeType,
    container: HTMLElement,
  ) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children as string))
    container.append(textNode)
  }

  //* 处理原生元素
  function processElement(
    n1: VnodeType | null,
    n2: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    // 初始化
    if (!n1) {
      mountElement(n2, container, parent)
      return
    }

    // 更新
    patchElement(n1, n2, container)
  }

  function patchElement(n1: VnodeType, n2: VnodeType, container: HTMLElement) {
    console.log('n1', n1)
    console.log('n2', n2)
    const el = (n2.el = n1.el)

    // 更新参数
    const oldProps = n1.props ?? EMPTY_OBJECT
    const newProps = n2.props ?? EMPTY_OBJECT
    patchProps(el, oldProps, newProps)
  }

  function patchProps(
    el: VnodeType['el'],
    oldProps: Record<string, any>,
    newProps: Record<string, any>,
  ) {
    if (oldProps === newProps) return
    //* 1.之前的值和现在的值不一样 —— 修改属性
    //* 2.新值为 undefined 或 null —— 删除
    //* 3.新属性无 —— 删除属性
    for (const key in newProps) {
      const prevProp = oldProps[key]
      const nextProp = newProps[key]

      if (prevProp !== nextProp) {
        hostPatchProps(el, key, prevProp, nextProp)
      }
    }

    if (oldProps !== EMPTY_OBJECT) {
      for (const key in oldProps) {
        if (!newProps.hasOwnProperty(key)) {
          hostPatchProps(el, key, oldProps[key], null)
        }
      }
    }
  }

  function mountElement(
    vnode: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    //* 创建元素
    const el = hostCreateElement(vnode.type)
    vnode.el = el

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
      const val = props[key]
      //* 处理属性
      hostPatchProps(el, key, null, val)
    }

    //* 将当前元素添加到容器上
    hostInsert(el, container)
  }

  function mountChildren(
    children: VnodeType[],
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    children.forEach(child => patch(null, child, container, parent))
  }

  //* 处理 vue 组件
  function processComponent(
    n1: VnodeType | null,
    n2: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
  ) {
    // 挂载组件
    mountComponent(n2, container, parent)
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
    effect(() => {
      const { proxy } = instance
      //* 初始化
      if (!instance.isMounted) {
        // vnode tree
        const subtree = (instance.subtree = instance.render!.call(proxy))

        // 根据 subtree 再调用 patch
        // vnode -> element -> mountElement
        patch(null, subtree, container, instance)

        vnode.el = subtree.el
        instance.isMounted = true
        return
      }

      //* 更新
      console.log('update')
      // vnode tree
      const subtree = instance.render!.call(proxy)
      const prevSubtree = instance.subtree

      patch(prevSubtree, subtree, container, instance)
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}

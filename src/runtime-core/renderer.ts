import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { EMPTY_OBJECT, isSameVnode, ShapeFlags } from '../utils'
import { Fragment, Text } from './vnode'
import type { VnodeType } from './vnode'
import type { ComponentInstance } from './component'
import { effect } from '../reactivity'

type RendererOptions = {
  createElement(type: VnodeType['type']): HTMLElement | any
  patchProps(el: any, key: string, prevProp: any, nextProp: any): void
  insert(child: any, parent: any, anchor: null | any): void
  remove(el: any): void
  setElementText(el: any, text: string): void
}

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options

  function render(vnode: VnodeType, container: HTMLElement) {
    // patch
    patch(null, vnode, container, null, null)
  }

  function patch(
    n1: VnodeType | null, // old
    n2: VnodeType, // new
    container: HTMLElement,
    parent: ComponentInstance | null,
    anchor: any | null,
  ) {
    const { shapeFlag, type } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理原生元素
          processElement(n1, n2, container, parent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理 vue 组件
          processComponent(n1, n2, container, parent, anchor)
        }
    }
  }

  //* Fragment
  function processFragment(
    n1: VnodeType | null,
    n2: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
    anchor: any | null,
  ) {
    mountChildren(n2.children as VnodeType[], container, parent, anchor)
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
    anchor: any | null,
  ) {
    // 初始化
    if (!n1) {
      mountElement(n2, container, parent, anchor)
      return
    }

    // 更新
    patchElement(n1, n2, container, parent as ComponentInstance, anchor)
  }

  function patchElement(
    n1: VnodeType,
    n2: VnodeType,
    container: HTMLElement,
    parentComponent: ComponentInstance,
    anchor: any | null,
  ) {
    const el = (n2.el = n1.el)

    // 更新子节点
    patchChildren(n1, n2, el, parentComponent, anchor)

    // 更新参数
    const oldProps = n1.props ?? EMPTY_OBJECT
    const newProps = n2.props ?? EMPTY_OBJECT
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(
    n1: VnodeType,
    n2: VnodeType,
    container: HTMLElement | Text | null,
    parentComponent: ComponentInstance,
    anchor: any | null,
  ) {
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag
    const c1 = n1.children
    const c2 = n2.children

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //* ? -> text
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 清空旧 children
        unmountChildren(n1.children as VnodeType[])
      }

      if (c1 !== c2) {
        // 设置 text
        hostSetElementText(container, c2 as any)
      }
    } else {
      //* ? -> array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(
          c2 as VnodeType[],
          container as HTMLElement,
          parentComponent,
          anchor,
        )
      } else {
        // diff array
        patchKeyChildren(
          c1 as VnodeType[],
          c2 as VnodeType[],
          container as HTMLElement,
          parentComponent,
          anchor,
        )
      }
    }
  }

  function patchKeyChildren(
    c1: VnodeType[],
    c2: VnodeType[],
    container: HTMLElement,
    parentComponent: ComponentInstance,
    anchor: any | null,
  ) {
    let i = 0
    const l1 = c1.length
    const l2 = c2.length
    let e1 = l1 - 1
    let e2 = l2 - 1

    //* 左边对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSameVnode(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }

      i++
    }

    //* 右边对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      if (isSameVnode(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }

      e1--
      e2--
    }

    //* 创建
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      //* 删除
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // todo: 乱序部分
    }
  }

  function unmountChildren(children: VnodeType[]) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el

      // remove
      hostRemove(el)
    }
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
    anchor: any | null,
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
      mountChildren(vnode.children as VnodeType[], el, parent, anchor)
    }

    // 设置属性 props
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      //* 处理属性
      hostPatchProps(el, key, null, val)
    }

    //* 将当前元素添加到容器上
    hostInsert(el, container, anchor)
  }

  function mountChildren(
    children: VnodeType[],
    container: HTMLElement,
    parent: ComponentInstance | null,
    anchor: any | null,
  ) {
    children.forEach(child => patch(null, child, container, parent, anchor))
  }

  //* 处理 vue 组件
  function processComponent(
    n1: VnodeType | null,
    n2: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
    anchor: any | null,
  ) {
    // 挂载组件
    mountComponent(n2, container, parent, anchor)
  }

  function mountComponent(
    vnode: VnodeType,
    container: HTMLElement,
    parent: ComponentInstance | null,
    anchor: any | null,
  ) {
    const instance = createComponentInstance(vnode, parent)

    setupComponent(instance)

    setupRenderEffect(instance, vnode, container, anchor)
  }

  function setupRenderEffect(
    instance: ComponentInstance,
    vnode: VnodeType,
    container: HTMLElement,
    anchor: any | null,
  ) {
    effect(() => {
      const { proxy } = instance
      //* 初始化
      if (!instance.isMounted) {
        // vnode tree
        const subtree = (instance.subtree = instance.render!.call(proxy))

        // 根据 subtree 再调用 patch
        // vnode -> element -> mountElement
        patch(null, subtree, container, instance, anchor)

        vnode.el = subtree.el
        instance.isMounted = true
        return
      }

      //* 更新
      console.log('update')
      // vnode tree
      const subtree = instance.render!.call(proxy)
      const prevSubtree = instance.subtree

      patch(prevSubtree, subtree, container, instance, anchor)
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}

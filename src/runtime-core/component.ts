import { initProps } from './componentProps'
import { publicInstanceProxyHandlers } from './componentPublicInstance'
import { emit } from './componentEmit'
import { initSlots } from './componentSlots'
import type { ComponentType, VnodeType } from './vnode'
import { effect, proxyRefs } from '../reactivity'

export type ComponentInstance = {
  isMounted: boolean
  proxy: typeof Proxy
  vnode: VnodeType
  next: VnodeType | null
  setupState: Record<keyof any, any>
  type: VnodeType['type']
  render?: (ctx: any) => VnodeType
  props: Record<string, any>
  provides: Record<string, any>
  parent: ComponentInstance | null
  emit: (event: string) => void
  slots: VnodeType[]
  subtree: VnodeType
  update: ReturnType<typeof effect>
}

let componentInstance: ComponentInstance | null = null

export function createComponentInstance(
  vnode: VnodeType,
  parent: ComponentInstance | null,
) {
  const component: ComponentInstance = {
    vnode,
    setupState: {},
    type: vnode.type,
    next: null,
    proxy: new Proxy({} as any, {}),
    props: vnode.props ?? {},
    provides: parent?.provides ?? {},
    parent,
    emit: () => {},
    slots: [],
    isMounted: false,
    subtree: {} as any,
    update: (() => {}) as any,
  }

  component.emit = emit.bind(null, component)

  return component
}

export function setupComponent(instance: ComponentInstance) {
  // 1.初始化 props
  initProps(instance, instance.vnode.props)

  // 2.初始化 slots
  initSlots(
    instance,
    instance.vnode.children as VnodeType | VnodeType[] | Record<string, any>,
  )

  // 3.初始化有状态组件 ( 区别于函数组件 )
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: ComponentInstance) {
  const Component = instance.vnode.type

  // 设置代理对象
  instance.proxy = new Proxy(
    { _: instance } as any,
    publicInstanceProxyHandlers,
  )

  const { setup } = Component as ComponentType
  if (typeof setup === 'function') {
    setComponentInstance(instance)
    const setupResult = setup(instance.props, {
      emit: instance.emit,
    }) as (() => any) | Record<keyof any, any>

    handleSetupResult(instance, setupResult)

    setComponentInstance(null)
  }
}

function handleSetupResult(
  instance: ComponentInstance,
  setupResult: (() => any) | Record<keyof any, any>,
) {
  if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult)
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: ComponentInstance) {
  const Component = instance.type as ComponentType

  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template)
    }
  }
  instance.render = Component.render
}

function setComponentInstance(instance: ComponentInstance | null) {
  componentInstance = instance
}

export function getComponentInstance() {
  return componentInstance
}

let compiler: any

export function registerRuntimeCompiler(_compiler: any) {
  compiler = _compiler
}

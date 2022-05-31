import { publicInstanceProxyHandlers } from './componentPublicInstance'
import type { ComponentType, VnodeType } from './vnode'

export type ComponentInstance = {
  proxy: typeof Proxy
  vnode: VnodeType
  setupState: Record<keyof any, any>
  type: VnodeType['type']
  render?: () => VnodeType
}

export function createComponentInstance(vnode: VnodeType) {
  const component: ComponentInstance = {
    vnode,
    setupState: {},
    type: vnode.type,
    proxy: new Proxy({} as any, {}),
  }

  return component
}

export function setupComponent(instance: ComponentInstance) {
  // 1.初始化 props
  // initProps()

  // 2.初始化 slots
  // initSlots()

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
    const setupResult = setup() as (() => any) | Record<keyof any, any>

    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(
  instance: ComponentInstance,
  setupResult: (() => any) | Record<keyof any, any>,
) {
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: ComponentInstance) {
  const Component = instance.type as ComponentType

  if (Component.render) {
    instance.render = Component.render
  }
}

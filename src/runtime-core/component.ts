import type { VnodeType } from './vnode'

// export type ComponentInstance = ReturnType<typeof createComponentInstance>
export type ComponentInstance = {
  vnode: VnodeType
  setupState: Record<keyof any, any>
  type: VnodeType['type']
  render?: () => VnodeType
}

export function createComponentInstance(vnode: VnodeType) {
  const component = { vnode, setupState: {}, type: vnode.type }

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

  const { setup } = Component
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
  const Component = instance.type

  if (Component.render) {
    instance.render = Component.render
  }
}

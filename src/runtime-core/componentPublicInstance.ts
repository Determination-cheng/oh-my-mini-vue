import type { ComponentInstance } from './component'

const getterMap = {
  $el: (i: ComponentInstance) => i.vnode.el,
}

export const publicInstanceProxyHandlers = {
  get({ _: instance }: { _: ComponentInstance }, key: string | symbol) {
    // setupState
    const { setupState } = instance
    if (setupState.hasOwnProperty(key)) {
      return setupState[key]
    }

    if (getterMap.hasOwnProperty(key)) {
      return getterMap[key as keyof typeof getterMap](instance)
    }
  },
}

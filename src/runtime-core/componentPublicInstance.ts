import { hasOwn } from '../utils'
import type { ComponentInstance } from './component'

const getterMap = {
  $el: (i: ComponentInstance) => i.vnode.el,
  $slots: (i: ComponentInstance) => i.slots,
  $props: (i: ComponentInstance) => i.props,
}

export const publicInstanceProxyHandlers = {
  get({ _: instance }: { _: ComponentInstance }, key: string | symbol) {
    const { setupState, props } = instance

    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key as string]
    }

    if (getterMap.hasOwnProperty(key)) {
      return getterMap[key as keyof typeof getterMap](instance)
    }
  },
}

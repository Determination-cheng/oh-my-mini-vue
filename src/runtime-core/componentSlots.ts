// @ts-nocheck
import type { ComponentInstance } from './component'
import type { VnodeType } from './vnode'

export function initSlots(
  instance: ComponentInstance,
  children: VnodeType | VnodeType[] | Record<string, any>,
) {
  instance.slots = Array.isArray(children) ? children : [children]
  // const slots = {}
  // for (const key in children) {
  //   const value = children[key]
  //   slots[key] = Array.isArray(value) ? value : [value]
  // }
  // instance.slots = slots
}

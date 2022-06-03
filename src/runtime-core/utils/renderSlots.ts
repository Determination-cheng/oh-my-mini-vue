import { createVNode } from '../vnode'
import type { ComponentInstance } from '../component'

export function renderSlots(
  slots: ComponentInstance['slots'] | Record<string, any>,
  name: string,
) {
  // const slot = (slots as Record<string, any>)[name]

  // if (slot) return createVNode('div', {}, slot)
  return createVNode('div', {}, slots)
}

import { shallowReadonly } from '../reactivity/reactive'
import type { ComponentInstance } from './component'

export function initProps(
  instance: ComponentInstance,
  props: Record<string, any> = {},
) {
  instance.props = shallowReadonly(props)
}

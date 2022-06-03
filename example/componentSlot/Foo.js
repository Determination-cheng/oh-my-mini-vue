// @ts-nocheck
import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  setup(props) {
    return {}
  },
  render() {
    const foo = h('p', {}, 'foo')

    // 从 App 那接收的 slot 的内容，本质上在 Foo 组件的 children
    // 通过 this.$slots 获取 Foo 这个 vnode 的 children
    console.log(this.$slots)
    return h('div', {}, [foo, renderSlots(this.$slots)])
  },
}

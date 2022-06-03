// @ts-nocheck
import {
  h,
  renderSlots,
  createTextVnode,
} from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    // const app = h('div', {}, 'App')
    // 这里第三个参数就是要插槽要渲染的东西
    // const foo = h(Foo, {}, h('p', {}, '123'))
    const foo = h(Foo, {}, [
      h('p', {}, '123'),
      h('p', {}, '456'),
      createTextVnode('kizuna AI'),
    ])
    // const foo = h(
    //   Foo,
    //   {},
    //   {
    //     header: h('p', {}, 'header'),
    //     footer: h('p', {}, 'header'),
    //   },
    // )

    return h('div', {}, [app, foo])
    // return h('div', {}, [
    //   renderSlots(this.$slots, 'header'),
    //   foo,
    //   renderSlots(this.$slots, 'footer'),
    // ])
  },

  setup() {
    return {}
  },
}

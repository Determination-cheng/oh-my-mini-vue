// @ts-nocheck
import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

window.self = null
export const App = {
  render() {
    window.self = this
    // ui
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'bold'],
      },
      [
        h('p', { class: 'red' }, 'hi, mini-vue'),
        h(Foo, {
          onAdd(a, b) {
            console.log('foo onAdd', a + b)
          },
          onAddFoo(a, b) {
            console.log('add-foo', a + b)
          },
        }),
      ],
    )
  },

  setup() {
    return { msg: 'mini-vue, hh' }
  },
}

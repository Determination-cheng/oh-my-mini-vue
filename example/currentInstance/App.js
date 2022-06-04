// @ts-nocheck
import { h, getComponentInstance } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    // ui
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'bold'],
      },
      [h('p', { class: 'red' }, 'hi, mini-vue'), h(Foo, { count: 1 })],
    )
  },

  setup() {
    const instance = getComponentInstance()
    console.log('App', instance)

    return { msg: 'mini-vue, hh' }
  },
}

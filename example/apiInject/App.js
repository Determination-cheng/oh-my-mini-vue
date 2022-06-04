import { h, createApp, provide, inject } from '../../lib/guide-mini-vue.esm.js'

const Provider = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooVal')
    provide('bar', 'barVal')
  },
  render() {
    return h('div', {}, [h('p', {}, 'Provider'), h(SecondProvider)])
  },
}

const SecondProvider = {
  name: 'SecondProvider',
  setup() {
    provide('secondFoo', 'secondFooVal')
    provide('foo', 'SecondFoo')
    const foo = inject('foo')

    return { foo }
  },
  render() {
    return h('div', {}, [
      h('p', {}, `SecondProvider —— foo: ${this.foo}`),
      h(Consumer),
    ])
  },
}

const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo')
    const bar = inject('bar')
    const baz = inject('baz', () => 'baz')

    const secondFoo = inject('secondFoo')

    return { foo, bar, baz, secondFoo }
  },
  render() {
    return h(
      'p',
      {},
      `Consumer —— foo: ${this.foo};  secondFoo: ${this.secondFoo};  bar: ${this.bar}; baz: ${this.baz}`,
      // `Consumer —— foo: ${this.foo}`,
    )
  },
}

createApp(Provider).mount('#app')

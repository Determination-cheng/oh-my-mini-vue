import { ref, isRef, unref, proxyRefs } from '../ref'
import { effect } from '../effect'
import { reactive } from '../reactive'

describe('ref', () => {
  it('happy path', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
  })

  it('ref object should be reactive', () => {
    const a = ref(1)
    let dummy = -1,
      calls = 0

    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)

    // set
    a.value = 2
    expect(calls).toBe(2)
    expect(calls).toBe(2)

    // set a new value shouldn't trigger effect
    a.value = 2
    expect(calls).toBe(2)
    expect(calls).toBe(2)
  })

  it('nested object inside ref object should be reactive', () => {
    const a = ref({ count: 1 })
    let dummy = -1
    effect(() => {
      dummy = a.value.count
    })

    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
  })

  it('isRef', () => {
    const a = ref(1)
    const user = reactive({ prop: 1 })

    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(user)).toBe(false)
  })

  it('unref', () => {
    const a = ref(1)

    expect(unref(a)).toBe(1)
    expect(unref(1)).toBe(1)
  })

  it('proxyRefs', () => {
    const user = {
      age: ref(10),
      name: 'hh',
    }
    const proxyUser = proxyRefs(user)

    // get
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe('hh')

    // set
    proxyUser.age = 20 as any // 通过 any 强行改变原来的数据类型
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    proxyUser.age = ref(10)
    expect(proxyUser.age).toBe(10)
    expect(user.age.value).toBe(10)
  })
})

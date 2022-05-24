import { ref } from '../ref'
import { effect } from '../effect'

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
})

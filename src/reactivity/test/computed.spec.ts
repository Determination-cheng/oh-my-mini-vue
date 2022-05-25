import { computed } from '../computed'
import { reactive } from '../reactive'

describe('computed', () => {
  it('happy path', () => {
    const user = reactive({ age: 1 })
    const age = computed(() => {
      return user.age
    })

    expect(age.value).toBe(1)
  })

  it('should compute lazily', () => {
    const reactiveValue = reactive({ foo: 1 })
    const getter = jest.fn(() => {
      return reactiveValue.foo
    })

    const cValue = computed(getter)

    // lazy
    expect(getter).not.toHaveBeenCalled()
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    // get
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    // don't compute util needed
    reactiveValue.foo = 2
    expect(getter).toHaveBeenCalledTimes(1)

    // shouldn't compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })
})

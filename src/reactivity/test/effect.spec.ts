import { reactive } from '../reactive'
import { effect } from '../effect'

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({ age: 10 })

    let next = 0
    effect(() => {
      next = user.age + 1
    })
    expect(next).toBe(11)

    // update
    user.age++
    expect(next).toBe(12)
  })

  it("effect's runner", () => {
    let foo = 10
    const runner = effect(() => {
      foo++
      return 'foo'
    })

    expect(foo).toBe(11)

    const r = runner()

    expect(foo).toBe(12)
    expect(r).toBe('foo')
  })
})

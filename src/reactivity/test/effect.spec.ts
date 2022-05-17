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
})

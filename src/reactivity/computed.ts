import { ReactiveEffect } from './effect'

class Computed<T> {
  private dirty = true
  private state: T | undefined = undefined
  private readonly effect: ReactiveEffect
  constructor(private getter: () => T) {
    this.effect = new ReactiveEffect(getter, () => {
      this.dirty = true
    })
  }

  get value() {
    if (this.dirty) {
      this.dirty = false
      // return (this.state = this.getter())
      this.state = this.effect.run()
    }
    return this.state
  }
}

export function computed<T>(getter: () => T) {
  return new Computed(getter)
}

let activeEffect: ReactiveEffect

class ReactiveEffect {
  constructor(private fn: () => void) {}

  run() {
    activeEffect = this
    this.fn()
  }
}

export function effect(fn: () => void) {
  const _effect = new ReactiveEffect(fn)

  _effect.run()
}

//* 依赖收集
const targetMap = new Map()
export function track(target: Record<string, unknown>, key: string | symbol) {
  // target -> key -> dep
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  dep.add(activeEffect)
}

//* 触发依赖
export function trigger(target: Record<string, unknown>, key: string | symbol) {
  let depsMap = targetMap.get(target)
  let dep = depsMap.get(key)

  for (const effect of dep) {
    effect.run()
  }
}

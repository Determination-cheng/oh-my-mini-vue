export * from './runtime-dom'

import { baseCompile } from './compiler-core'
import * as runtimeDOM from './runtime-dom'
import { registerRuntimeCompiler } from './runtime-dom'

function compileToFunction(template: string) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDOM)

  return render
}

registerRuntimeCompiler(compileToFunction)

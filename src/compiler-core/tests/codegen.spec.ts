import { generate } from '../codegen'
import { baseParse } from '../parse'
import { transform } from '../transform'

describe('codegen', () => {
  it('string', () => {
    const ast = baseParse('hi')
    transform(ast)

    const { code } = generate(ast)

    // 快照
    // 1.抓 bug
    // 2.抓取更新快照
    expect(code).toMatchSnapshot()
  })
})

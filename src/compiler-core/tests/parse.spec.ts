import { baseParse } from '../parse'
import { NodeTypes } from '../ast'

describe('Parse', () => {
  describe('interpolation', () => {
    test('simple interpolation', () => {
      const ast = baseParse('{{ message }}')

      // root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESS,
          content: 'message',
        },
      })
    })
  })
})

describe('element', () => {
  it('simple element div', () => {
    const ast = baseParse('<div></div>')

    // root
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
    })
  })
})

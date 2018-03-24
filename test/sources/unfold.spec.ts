
import 'babel-polyfill'
import { expect } from 'chai'
import { unfold } from '../../src/index'

describe('unfold', () => {
  it('simple', async () => {
    const result = await unfold(s => {
      if (s <= 5) {
        return [s + 1, 'a' + s]
      }
      return undefined
    }, 1).runToArray()
    expect(result).to.eql(['a1', 'a2', 'a3', 'a4', 'a5'])
  });
  it('with cancel', async () => {
    const result = await unfold(s => [s + 1, 'a' + s], 1).take(5).runToArray()
    expect(result).to.eql(['a1', 'a2', 'a3', 'a4', 'a5'])
  })
})

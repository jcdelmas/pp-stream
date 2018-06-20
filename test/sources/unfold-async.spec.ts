
import 'babel-polyfill'
import 'should'
import { unfoldAsync } from '../../src/index'
import { delayed } from '../utils'

describe('unfoldAsync', () => {
  it('simple', async () => {
    const result = await unfoldAsync(s => delayed(10, s <= 5 ? [s + 1, 'a' + s] as [number, string] : undefined), 1).runToArray()
    result.should.be.eql(['a1', 'a2', 'a3', 'a4', 'a5'])
  })
  it('with cancel', async () => {
    const result = await unfoldAsync(s => delayed(10, [s + 1, 'a' + s] as [number, string]), 1).take(5).runToArray()
    result.should.be.eql(['a1', 'a2', 'a3', 'a4', 'a5'])
  })
  it('with error', async () => {
    unfoldAsync(() => Promise.reject('rejected'), 1).runToArray().should.be.rejected()
  })
})

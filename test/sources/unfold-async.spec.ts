
import 'babel-polyfill'
import { expect, use } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { unfoldAsync } from '../../src/index'
import { delayed } from '../utils'

use(chaiAsPromised)

describe('unfoldAsync', () => {
  it('simple', async () => {
    const result = await unfoldAsync(s => delayed(10, s <= 5 ? [s + 1, 'a' + s] as [number, string] : undefined), 1).runToArray()
    expect(result).to.eql(['a1', 'a2', 'a3', 'a4', 'a5'])
  })
  it('with cancel', async () => {
    const result = await unfoldAsync(s => delayed(10, [s + 1, 'a' + s] as [number, string]), 1).take(5).runToArray()
    expect(result).to.eql(['a1', 'a2', 'a3', 'a4', 'a5'])
  })
  it('with error', async () => {
    const promise = unfoldAsync(() => Promise.reject('rejected'), 1).runToArray()
    await expect(promise).to.be.rejectedWith('rejected')
  })
})

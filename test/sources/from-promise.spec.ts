
import "babel-polyfill"
import { expect, use } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { fromPromise } from "../../src/index"
import { delayed } from '../utils'

use(chaiAsPromised)

describe('fromPromise', () => {
  it('simple', async () => {
    const result = await fromPromise(delayed(100, 10)).runToArray()
    expect(result).to.eql([10])
  })
  it('direct', async () => {
    const result = await fromPromise(Promise.resolve(5)).runToArray()
    expect(result).to.eql([5])
  })
  it('with error', async () => {
    const promise = fromPromise(Promise.reject('Rejected')).runToArray()
    await expect(promise).to.be.rejectedWith('Rejected')
  })
})

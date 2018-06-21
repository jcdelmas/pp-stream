import 'babel-polyfill'
import { expect, use } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { fromArray, map } from '../../src/index'

use(chaiAsPromised)

describe('recover', () => {
  it('on source', async () => {
    const result = await fromArray([1, 2, 3, 4, 5])
      .map(x => {
        if (x === 3) {
          throw new Error()
        }
        return x
      })
      .recover(() => -1)
      .runToArray()
    expect(result).to.eql([1, 2, -1])
  })

  it('on flow', async () => {
    const result = await fromArray([1, 2, 3, 4, 5])
      .pipe(
        map((x: number) => {
          if (x === 3) {
            throw new Error()
          }
          return x
        })
          .recover(() => -1)
      )
      .runToArray()
    expect(result).to.eql([1, 2, -1])
  })

  it('with rethrow', async () => {
    const result = fromArray([1, 2, 3, 4, 5])
      .map(x => {
        if (x === 3) {
          throw new Error('error' + x)
        }
        return x
      })
      .recover(() => {
        throw new Error('New Error')
      })
      .runToArray()
    await expect(result).to.be.eventually.rejectedWith('New Error')
  })
})

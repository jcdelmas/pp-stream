import 'babel-polyfill'
import { expect } from 'chai'
import { filter, fromArray, map, toArray } from '../../src'

describe('routing', () => {
  it('simple', async() => {
    const result = await fromArray([1, 2, 3]).pipe(map((x: number) => x + 1)).runToArray()
    expect(result).to.eql([2, 3, 4])
  })
  it('complex', async() => {
    const result = await fromArray([1, 2, 3, 4, 5])
      .pipe(filter((x: number) => x > 2).map(x => x - 1))
      .runToArray()
    expect(result).to.eql([2, 3, 4])
  })
  it('with Sink', async() => {
    const result = await fromArray([1, 2, 3]).runWith(map((x: number) => x + 1).to(toArray()))
    expect(result).to.eql([2, 3, 4])
  })
})

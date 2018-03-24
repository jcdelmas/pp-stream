import 'babel-polyfill'
import { expect } from 'chai'
import { broadcastSinks, forEach, fromArray, map, take } from '../../src'

describe('broadcast', () => {
  it('with sources', async() => {
    const first: number[] = []
    const second: number[] = []
    await fromArray([1, 2, 3]).runWith(
      broadcastSinks(
        map((x: number) => x + 1).to(forEach((x: number) => first.push(x))),
        map((x: number) => x + 2).to(forEach((x: number) => second.push(x)))
      )
    )
    expect(first).to.eql([2, 3, 4]);
    expect(second).to.eql([3, 4, 5]);
  });
  it('with early cancel', async() => {
    const first: number[] = []
    const second: number[] = []
    await fromArray([1, 2, 3]).runWith(
      broadcastSinks(
        take<number>(2).to(forEach((x: number) => first.push(x))),
        map((x: number) => x + 1).to(forEach((x: number) => second.push(x)))
      )
    )
    expect(first).to.eql([1, 2])
    expect(second).to.eql([2, 3, 4])
  });
  it('with flow', async() => {
    const first: number[] = []
    const second: number[] = []
    const sink = map((x: number) => x + 1).to(
      broadcastSinks(
        map((x: number) => x + 1).to(forEach(x => first.push(x))),
        map((x: number) => x + 2).to(forEach(x => second.push(x)))
      )
    )
    await fromArray([1, 2, 3]).runWith(sink);
    expect(first).to.eql([3, 4, 5]);
    expect(second).to.eql([4, 5, 6]);
  })
  it('with sink', async() => {
    const first: number[] = []
    const second: number[] = []
    const sink = broadcastSinks(
      map((x: number) => x + 1).to(forEach(x => first.push(x))),
      map((x: number) => x + 2).to(forEach(x => second.push(x)))
    )
    await fromArray([1, 2, 3]).map(x => x + 1).runWith(sink);
    expect(first).to.eql([3, 4, 5]);
    expect(second).to.eql([4, 5, 6]);
  });
});

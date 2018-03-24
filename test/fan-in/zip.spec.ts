import 'babel-polyfill'
import { expect } from 'chai'
import { fromArray, map, zip3Sources } from 'index'

describe('zip', () => {
  it('with sources', async() => {
    const result = await fromArray([1, 2]).zip(fromArray([3, 4])).runToArray();
    expect(result).to.eql([[1, 3], [2, 4]]);
  });
  it('with multiple sources', async() => {
    const result = await zip3Sources(
      fromArray([1, 2]),
      fromArray([3, 4]),
      fromArray([5, 6])
    ).runToArray();
    expect(result).to.eql([[1, 3, 5], [2, 4, 6]]);
  })

  it('with flow', async () => {
    const result = await fromArray([3, 4]).pipe(map((x: number) => x - 2).zip(fromArray([3, 4]))).runToArray()
    expect(result).to.eql([[1, 3], [2, 4]])
  });

  it('with different sizes', async() => {
    const result = await fromArray([1, 2, 3, 4]).zip(fromArray([3, 4])).runToArray()
    expect(result).to.eql([[1, 3], [2, 4]])
  });
});

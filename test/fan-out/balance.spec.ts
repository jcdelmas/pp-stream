import 'babel-polyfill'
import { expect } from 'chai'
import { delayedFlow } from '../utils'
import { balance, fanOutAndFanIn, fromArray, map, merge, take, toArray } from '../../src'

describe('balance', () => {
  const DELAY = 50;
  it('with sources', async() => {
    const result = await fromArray([1, 2, 3, 4]).throttle(10).fanOutAndFanIn<number>(balance)(
      delayedFlow<number>(DELAY).map(x => "A" + x),
      delayedFlow<number>(DELAY).map(x => "B" + x)
    )<string>(merge).runToArray();
    expect(result).to.eql(["A1", "B2", "A3", "B4"]);
  });
  it('with early cancel', async() => {
    const result = await fromArray([1, 2, 3, 4]).throttle(10).fanOutAndFanIn<number>(balance)(
      take<number>(1).pipe(delayedFlow(DELAY)).map(x => "A" + x),
      delayedFlow<number>(DELAY).map(x => "B" + x)
    )<string>(merge).runToArray();
    expect(result).to.eql(["A1", "B2", "B3", "B4"]);
  });
  it('with flow', async() => {
    const sink = map((x: number) => x + 1).fanOutAndFanIn<number>(balance)(
      delayedFlow<number>(DELAY).map(x => "A" + x),
      delayedFlow<number>(DELAY).map(x => "B" + x)
    )<string>(merge).to(toArray())
    const result = await fromArray([1, 2, 3, 4]).throttle(10).runWith(sink)
    expect(result).to.eql(["A2", "B3", "A4", "B5"]);
  });
  it('with sink', async() => {
    const sink = fanOutAndFanIn<number, number>(balance)(
      delayedFlow<number>(DELAY).map(x => "A" + x),
      delayedFlow<number>(DELAY).map(x => "B" + x)
    )<string>(merge).to(toArray())
    const result = await fromArray([1, 2, 3, 4]).throttle(10).runWith(sink)
    expect(result).to.eql(["A1", "B2", "A3", "B4"]);
  });
});

import 'babel-polyfill'
import { expect, use } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { checkTime, TimedSource } from '../utils'
import { repeat, fromArray } from '../../src/index'

use(chaiAsPromised)

describe('throttle', () => {
  it('simple', async() => {
    const startTime = new Date().getTime();
    const result = await repeat(1).throttle(100).take(4).map(() => new Date().getTime() - startTime).runToArray()
    expect(result).to.have.length(4);
    result.forEach((time, i) => {
      checkTime(time, i * 100);
    });
  });
  it('with elements > 1', async() => {
    const startTime = new Date().getTime();
    const result = await repeat(1).take(4)
      .throttle(200, { elements: 2 })
      .map(() => new Date().getTime() - startTime)
      .runToArray();
    expect(result).to.have.length(4);
    checkTime(result[0], 0);
    checkTime(result[1], 0);
    checkTime(result[2], 200);
    checkTime(result[3], 200);
  });
  it('with maximumBurst', async() => {
    const startTime = new Date().getTime();
    const result = await TimedSource.of([
      [0, 1],
      [100, 2],
      [300, 3],
      [0, 4],
      [0, 5],
      [0, 6]
    ])
      .throttle(100, { maximumBurst: 2 })
      .map(() => new Date().getTime() - startTime)
      .runToArray();

    expect(result).to.have.length(6);
    checkTime(result[0], 0);
    checkTime(result[1], 100);
    checkTime(result[2], 400);
    checkTime(result[3], 400);
    checkTime(result[4], 400);
    checkTime(result[5], 500);
  });
  it('with cost calculation', async() => {
    const startTime = new Date().getTime();
    const result = await fromArray([
      [1],
      [2, 3],
      [4, 5, 6, 7],
      [8, 9],
      [10, 11],
      [12, 13]
    ])
      .throttle(100, { cost: 3, maximumBurst: 6, costCalculation: xs => xs.length })
      .map(() => new Date().getTime() - startTime)
      .runToArray();
    expect(result).to.have.length(6);
    checkTime(result[0], 0);
    checkTime(result[1], 0);
    checkTime(result[2], 200);
    checkTime(result[3], 200);
    checkTime(result[4], 300);
    checkTime(result[5], 400);
  });
  it('with failOnPressure', async() => {
    const promise = TimedSource.of([
      [0, 1],
      [100, 2],
      [0, 3]
    ])
      .throttle(100, { failOnPressure: true })
      .runToArray()

    await expect(promise).to.be.rejectedWith('Maximum throttle throughput exceeded.')
  });
});

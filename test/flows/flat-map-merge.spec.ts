
import 'babel-polyfill';
import { expect } from 'chai';

import { TimedSource } from '../utils';

describe('flatMapMerge', () => {
  it('simple', async() => {
    const source = TimedSource
      .then(0, 10)
      .then(50, 20)
      .then(50, 30)
      .toSource();
    const result = await source.flatMapMerge(i => {
      return TimedSource
        .then(50, i + 1)
        .then(150, i + 2)
        .then(150, i + 3)
        .toSource();
    }).runToArray();
    expect(result).to.eql([11, 21, 31, 12, 22, 32, 13, 23, 33]);
  });
  it('with breadth limit', async() => {
    const source = TimedSource
      .then(0, 10)
      .then(50, 20)
      .then(50, 30)
      .toSource();
    const result = await source.flatMapMerge(i => {
      return TimedSource
        .then(0, i + 1)
        .then(150, i + 2)
        .then(150, i + 3)
        .toSource();
    }, 2).runToArray();
    expect(result).to.eql([11, 21, 12, 22, 13, 31, 23, 32, 33]);
  });
  it('with cancel', async() => {
    const source = TimedSource
      .then(0, 10)
      .then(50, 20)
      .then(50, 30)
      .then(200, 40)
      .toSource();
    const result = await source.flatMapMerge(i => {
      return TimedSource
        .then(50, i + 1)
        .then(150, i + 2)
        .then(150, i + 3)
        .toSource();
    }).take(5).runToArray();
    expect(result).to.eql([11, 21, 31, 12, 22]);
  });
});

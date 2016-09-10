"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';
import { TimedSource } from '../utils';

describe('from callback sources', () => {
  it('simple', async () => {
    const result = await Source.fromCallback((push, done) => {
      push(1);
      push(2);
      push(3);
      done();
    }).toArray();
    result.should.be.eql([1, 2, 3]);
  });
  it('with interval', async () => {
    const result = await TimedSource.then(50, 1).then(50, 2).then(50, 3).toSource().toArray();
    result.should.be.eql([1, 2, 3]);
  });
  it('with cancel', async () => {
    const result = await TimedSource
      .then(50, 1)
      .then(50, 2)
      .then(50, 3)
      .then(50, 4)
      .then(50, 5)
      .toSource()
      .take(3)
      .toArray();
    result.should.be.eql([1, 2, 3]);
  });
});
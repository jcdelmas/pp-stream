"use strict";

import 'babel-polyfill';
import { Source, Sink } from '../../src/index';
import { expectPromise } from '../utils';

describe('ignore', () => {
  it('simple', async() => {
    const xs = [];
    await Source.from([1, 2, 3]).map(x => {
      xs.push(x);
      return x;
    }).runWith(Sink.ignore());
    expect(xs).toEqual([1, 2, 3]);
  });
  it('with error', async() => {
    await expectPromise(Source.failed('Coucou').runWith(Sink.ignore())).toThrowError('Coucou');
  });
});

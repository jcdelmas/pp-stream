"use strict";

import 'babel-polyfill';
import 'should';
import { Source, Sink } from '../../src/index';

describe('ignore', () => {
  it('simple', async() => {
    const xs = [];
    await Source.from([1, 2, 3]).map(x => {
      xs.push(x);
      return x;
    }).runWith(Sink.ignore());
    xs.should.be.eql([1, 2, 3]);
  });
  it('with error', async() => {
    Source.failed('Coucou').runWith(Sink.ignore()).should.be.rejectedWith('Coucou');
  });
});

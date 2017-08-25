"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('ignore', () => {
  it('simple', async () => {
    const log = [];
    await Source.from(['foo', 'bar', 'baz']).map(x => {
      log.push(x);
      return x;
    }).ignore();
    log.should.be.eql(['foo', 'bar', 'baz']);
  });
});

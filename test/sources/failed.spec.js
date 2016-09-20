"use strict";

import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('failed', () => {
  it('simple', async () => {
    const message = 'Error !!!';
    Source.failed(message).toArray().should.be.rejectedWith(message);
  });
});

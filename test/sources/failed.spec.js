"use strict";

import 'babel-polyfill';
import { Source } from '../../src/index';
import { expectPromise } from '../utils';

describe('failed', () => {
  it('simple', async () => {
    const message = 'Error !!!';
    await expectPromise(Source.failed(message).toArray()).toThrowError(message);
  });
});

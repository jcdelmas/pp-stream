
import 'babel-polyfill';
import 'should';

import { Source } from '../../src/index';

describe('sliding', () => {
  it('simple', async () => {
    const result = await Source.from([1, 2, 3, 4, 5]).sliding(3).toArray();
    result.should.be.eql([[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
  });
  it('with step > 1', async () => {
    const result = await Source.from([1, 2, 3, 4, 5, 6]).sliding(3, 2).toArray();
    result.should.be.eql([[1, 2, 3], [3, 4, 5], [5, 6]]);
  });
});
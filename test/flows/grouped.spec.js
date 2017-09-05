
import 'babel-polyfill';
import 'should';

import { Source } from '../../src/index';

describe('grouped', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3, 4, 5]).grouped(2).toArray();
    result.should.be.eql([[1, 2], [3, 4], [5]]);
  });
});

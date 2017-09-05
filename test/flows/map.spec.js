
import 'babel-polyfill';
import 'should';

import { Source } from '../../src/index';

describe('map', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).map(x => x + 1).toArray();
    result.should.be.eql([2, 3, 4]);
  });
});

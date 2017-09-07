
import 'babel-polyfill';
import 'should';

import { Source } from '../../src/index';

describe('take', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3, 4]).take(2).runToArray();
    result.should.be.eql([1, 2]);
  });
  it('early complete', async() => {
    const result = await Source.from([1, 2]).take(4).runToArray();
    result.should.be.eql([1, 2]);
  });
});

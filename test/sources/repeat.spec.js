
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('repeat', () => {
  it('simple', async() => {
    const result = await Source.repeat(7).take(3).runToArray();
    result.should.be.eql([7, 7, 7]);
  });
});

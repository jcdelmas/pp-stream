
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('dropWhile', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3, 1]).dropWhile(x => x < 3).runToArray();
    result.should.be.eql([3, 1]);
  });
  it('with early complete', async() => {
    const result = await Source.from([1, 2]).dropWhile(x => x < 3).runToArray();
    result.should.be.eql([]);
  });
  it('with cancel', async() => {
    const result = await Source.from([1, 2, 3, 4]).dropWhile(x => x < 3).take(1).runToArray();
    result.should.be.eql([3]);
  });
});

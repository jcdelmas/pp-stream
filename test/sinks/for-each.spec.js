
import 'babel-polyfill';
import 'should';
import { Source } from '../../src/index';

describe('forEach', () => {
  it('simple', async() => {
    const xs = [];
    await Source.from([1, 2, 3]).forEach(x => xs.push(x));
    xs.should.be.eql([1, 2, 3]);
  });
});
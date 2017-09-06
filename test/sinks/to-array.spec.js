
import 'babel-polyfill';
import 'should';
import {
  Source,
  Sink
} from '../../src/index';

describe('toArray', () => {
  it('simple', async () => {
    const result = await Source.from([1, 2, 3]).toArray();
    result.should.be.eql([1, 2, 3]);
  });
  it('with to', async () => {
    const result = await Source.from([1, 2, 3]).pipe(Sink.toArray().key('foo')).run().foo;
    result.should.be.eql([1, 2, 3]);
  });
});

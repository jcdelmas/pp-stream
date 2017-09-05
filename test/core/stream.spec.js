
import 'babel-polyfill';
import 'should';
import {
  Source,
  Flow,
  Sink
} from '../../src/index';

describe('routing', () => {
  it('simple', async() => {
    const result = await Source.from([1, 2, 3]).pipe(Flow.map(x => x + 1)).toArray();
    result.should.be.eql([2, 3, 4]);
  });
  it('complex', async() => {
    const result = await Source.from([1, 2, 3, 4, 5])
      .pipe(Flow.filter(x => x > 2).map(x => x - 1))
      .toArray();
    result.should.be.eql([2, 3, 4]);
  });
  it('with Sink', async() => {
    const result = await Source.from([1, 2, 3])
      .runWith(Flow.map(x => x + 1).pipe(Sink.toArray()));
    result.should.be.eql([2, 3, 4]);
  });
});

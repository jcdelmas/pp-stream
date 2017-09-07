
import 'babel-polyfill';
import 'should';
import {
  Source,
  OverflowStrategy
} from '../../src/index';

describe('buffer', () => {
  it('drop head', async() => {
    const result = await Source.from([1, 2, 3, 4, 5])
      .buffer(2, OverflowStrategy.DROP_HEAD)
      .throttle(50)
      .runToArray();
    result.should.be.eql([1, 2, 4, 5]);
  });
  it('drop tail', async() => {
    const result = await Source.from([1, 2, 3, 4, 5])
      .buffer(2, OverflowStrategy.DROP_TAIL)
      .throttle(50)
      .runToArray();
    result.should.be.eql([1, 2, 3, 5]);
  });
  it('drop new', async() => {
    const result = await Source.from([1, 2, 3, 4, 5])
      .buffer(2, OverflowStrategy.DROP_NEW)
      .throttle(50)
      .runToArray();
    result.should.be.eql([1, 2, 3, 4]);
  });
  it('drop buffer', async() => {
    const result = await Source.from([1, 2, 3, 4, 5])
      .buffer(2, OverflowStrategy.DROP_BUFFER)
      .throttle(50)
      .runToArray();
    result.should.be.eql([1, 2, 5]);
  });
  it('back pressure', async() => {
    const result = await Source.from([1, 2, 3, 4, 5])
      .buffer(2, OverflowStrategy.BACK_PRESSURE)
      .throttle(50)
      .runToArray();
    result.should.be.eql([1, 2, 3, 4, 5]);
  });
  it('fail', async() => {
    Source.from([1, 2, 3, 4, 5])
      .buffer(2, OverflowStrategy.FAIL)
      .throttle(50)
      .runToArray()
      .should.be.rejectedWith({ message: 'Buffer overflow' });
  });
});


import "babel-polyfill";
import "should";
import { Source } from "../../src/index";
import { delayed } from '../utils';

describe('fromPromise', () => {
  it('simple', async () => {
    const result = await Source.fromPromise(delayed(100, 10)).runToArray();
    result.should.be.eql([10]);
  });
  it('direct', async () => {
    const result = await Source.fromPromise(Promise.resolve(5)).runToArray();
    result.should.be.eql([5]);
  });
  it('with error', async () => {
    Source.fromPromise(Promise.reject('Rejected')).runToArray().should.be.rejected();
  });
});
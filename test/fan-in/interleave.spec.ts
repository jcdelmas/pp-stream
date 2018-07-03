import 'babel-polyfill'
import { expect } from 'chai'
import {
  broadcast,
  complexFlow,
  FlowShape,
  fromArray,
  GraphBuilder,
  map,
  OverflowStrategy
} from '../../src/index'

import { interleave, interleaveSources, interleaveWith } from '../../src/fan-in/interleave'

describe('interleave', () => {
  it('simple', async () => {
    const result = await fromArray([1, 2, 3]).pipe(interleaveWith(fromArray([4, 5, 6, 7, 8]))).runToArray()
    expect(result).to.eql([1, 4, 2, 5, 3, 6, 7, 8])
  });
  it('with segment size > 1', async() => {
    const result = await fromArray([1, 2, 3]).pipe(interleaveWith(fromArray([4, 5, 6, 7, 8]), 2)).runToArray()
    expect(result).to.eql([1, 2, 4, 5, 3, 6, 7, 8])
  });
  it('with cancel', async() => {
    const result = await fromArray([1, 2, 3])
      .pipe(interleaveWith(fromArray([4, 5, 6, 7, 8])))
      .take(6)
      .runToArray()
    expect(result).to.eql([1, 4, 2, 5, 3, 6])
  });
  it('with more than 2 sources', async() => {
    const result = await interleaveSources()(
      fromArray([1, 2, 3]),
      fromArray([4, 5, 6]),
      fromArray([7, 8, 9])
    ).runToArray()
    expect(result).to.eql([1, 4, 7, 2, 5, 8, 3, 6, 9])
  });
  it('with broadcast', async () => {
    const result = await fromArray([1, 2, 3]).pipe(complexFlow((b: GraphBuilder) => {
      const flow1 = b.add(map<number, number>(x => x).buffer(1, OverflowStrategy.BACK_PRESSURE))
      const flow2 = b.add(map<number, number>(x => x * 2).buffer(1, OverflowStrategy.BACK_PRESSURE))
      const flow3 = b.add(map<number, number>(x => x * 3).buffer(1, OverflowStrategy.BACK_PRESSURE))

      const bcast = b.add(broadcast<number>(3))
      const merge = b.add(interleave<number>(1)(3))

      bcast.outputs[0].wire(flow1.input)
      bcast.outputs[1].wire(flow2.input)
      bcast.outputs[2].wire(flow3.input)

      flow1.output.wire(merge.inputs[0])
      flow2.output.wire(merge.inputs[1])
      flow3.output.wire(merge.inputs[2])

      return new FlowShape(bcast.input, merge.output)
    })).runToArray()
    expect(result).to.eql([1, 2, 3, 2, 4, 6, 3, 6, 9]);
  });
});

import Sink from './sink';
import Module from './module';
import _ from 'lodash';


export default class Stream {

  /**
   * @param {function} stageFactory
   * @returns {Stream}
   */
  static fromSourceStageFactory(stageFactory) {
    return Stream.fromStageFactory(stageFactory, 0, 1);
  }

  /**
   * @param {function} stageFactory
   * @returns {Stream}
   */
  static fromSinkStageFactory(stageFactory) {
    return Stream.fromStageFactory(stageFactory, 1, 0);
  }

  /**
   * @param {function} stageFactory
   * @param {number} inputs
   * @param {number} outputs
   * @returns {Stream}
   */
  static fromStageFactory(stageFactory, inputs = 1, outputs = 1) {
    return new Stream(inputs, outputs, attrs => Module.fromStageFactory(stageFactory, attrs));
  }

  static groupStreams(streams) {
    return new Stream(
      _.sum(streams.map(s => s._inCount)),
      _.sum(streams.map(s => s._outCount)),
      attrs => Module.group(streams.map(s => s._materialize()), attrs)
    );
  }

  static fromGraph(inCount, outCount, factory) {
    return new Stream(inCount, outCount, attrs => {
      const submodules = [];
      const { inputs = [], outputs = [] } = factory({
        add: s => {
          const module = s._materialize();
          submodules.push(module);
          return module.wrapper();
        }
      });
      if (inputs.length != inCount) {
        throw new Error('Invalid inputs number');
      }
      if (outputs.length != outCount) {
        throw new Error('Invalid outputs number');
      }
      return Module.create(
        inputs.map(i => i._input),
        outputs.map(o => o._output),
        submodules,
        attrs
      );
    });
  }

  /**
   * @param {number} inCount
   * @param {number} outCount
   * @param {function} materializer
   * @param {object} attributes
   */
  constructor(inCount, outCount, materializer, attributes = {}) {
    this._inCount = inCount;
    this._outCount = outCount;
    this._materializer = materializer;
    this._attributes = attributes;
  }

  _materialize() {
    return this._materializer(this._attributes);
  }

  key(key) {
    return this.withAttributes({ key });
  }

  withAttributes(attrs) {
    return new Stream(
      this._inCount,
      this._outCount,
      this._materializer,
      { ...this._attributes, ...attrs }
    );
  }

  /**
   * @param {Stream} stream
   * @return {Stream}
   */
  pipe(stream) {
    if (this._outCount != stream._inCount) {
      throw new Error('Invalid wiring');
    }
    return Stream.fromGraph(this._inCount, stream._outCount, b => {
      const prev = b.add(this);
      const next = b.add(stream);
      prev.outputs().forEach((out, i) => out.wire(next.in(i)));
      return {
        inputs: prev.inputs(),
        outputs: next.outputs()
      };
    });
  }

  /**
   * @param {function} fanInFactory
   * @return {Stream}
   */
  fanIn(fanInFactory) {
    if (this._outCount <= 1) {
      throw new Error('No more than 1 outputs');
    }
    return this.pipe(fanInFactory(this._outCount));
  }

  // Source methods

  /**
   * @param {Stream} sink
   */
  runWith(sink) {
    return this.pipe(sink.key('_result')).run()._result;
  }

  /**
   * @param {SinkStage} sinkStage
   */
  runWithLastStage(sinkStage) {
    return this.runWith(Sink.create(() => sinkStage));
  }

  // Closed graph methods

  run() {
    const module = this._materialize();
    module.start();
    return module.materializedValue;
  }
}

import { Flow } from '../core/flow'
import { Source } from '../core/source'
import '../flows/map'
import { zip3Sources, zipSources } from './zip'

export function zipSourcesWith<I1, I2, O>(s1: Source<I1>, s2: Source<I2>, f: (i1: I1, i2: I2) => O): Source<O> {
  return zipSources(s1, s2).map(([i1, i2]: [I1, I2]) => f(i1, i2))
}

export function zip3SourcesWith<I1, I2, I3, O>(s1: Source<I1>, s2: Source<I2>, s3: Source<I3>, f: (i1: I1, i2: I2, i3: I3) => O): Source<O> {
  return zip3Sources(s1, s2, s3).map(([i1, i2, i3]: [I1, I2, I3]) => f(i1, i2, i3))
}

declare module '../core/source' {
  interface Source<O> {
    zipWith<O2, O3>(s: Source<O2>, f: (x1: O, x2: O2) => O3): Source<O3>
  }
}

declare module '../core/flow' {
  interface Flow<I, O> {
    zipWith<O2, O3>(s: Source<O2>, f: (x1: O, x2: O2) => O3): Flow<I, O3>
  }
}

Source.prototype.zipWith = function<O1, O2, O3>(this: Source<O1>, s: Source<O2>, f: (x1: O1, x2: O2) => O3): Source<O3> {
  return this.zip(s).map(([x1, x2]) => f(x1, x2))
}

Flow.prototype.zipWith = function<I, O1, O2, O3>(this: Flow<I, O1>, s: Source<O2>, f: (x1: O1, x2: O2) => O3) {
  return this.zip(s).map(([x1, x2]) => f(x1, x2))
}

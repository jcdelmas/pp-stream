import { Shape, Startable } from './stage'

export default interface GraphInstance<S extends Shape, R> extends Startable {
  readonly shape: S,
  readonly resultValue: R
}
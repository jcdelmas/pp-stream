
export function keepLeft<A>(left: A): A {
  return left
}

export function keepRight<A>(_left: any, right: A): A {
  return right
}

export function keepBoth<A, B>(left: A, right: B): [A, B] {
  return [left, right]
}

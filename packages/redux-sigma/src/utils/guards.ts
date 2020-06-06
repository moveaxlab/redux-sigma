export function not<A extends unknown[]>(
  f: (...args: A) => boolean
): (...args: A) => boolean {
  return (...args: A) => !f(...args);
}

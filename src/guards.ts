/**
 * Returns the negation of the input function.
 *
 * @param f A function.
 */
export function not<A extends unknown[]>(
  f: (...args: A) => boolean
): (...args: A) => boolean {
  return (...args: A) => !f(...args);
}

/**
 * Returns a boolean function returning true if all input functions
 * return true.
 *
 * @param fs An array of functions.
 */
export function and<A extends unknown[]>(
  ...fs: Array<(...args: A) => boolean>
): (...args: A) => boolean {
  return function(...args: A): boolean {
    return fs.every(f => f(...args));
  };
}

/**
 * Returns a boolean function returning true if at least one input functions
 * returns true.
 *
 * @param fs An array of functions.
 */
export function or<A extends unknown[]>(
  ...fs: Array<(...args: A) => boolean>
): (...args: A) => boolean {
  return function(...args: A): boolean {
    return fs.some(f => f(...args));
  };
}

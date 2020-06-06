/* eslint-disable @typescript-eslint/no-explicit-any */

export type FirstArgumentType<F extends Function> = F extends (
  first: infer A,
  ...args: any[]
) => any
  ? A
  : never;

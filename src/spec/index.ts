import { StateAttributes } from './states';

/**
 * This is the root type of the `spec` field of each state machine.
 * It's a mapping of each possible state to the specification of that
 * state.
 */
export type StateMachineSpec<
  E extends string,
  S extends string,
  SM extends string,
  C
> = { [key in S]: StateAttributes<E, S, SM, C> };

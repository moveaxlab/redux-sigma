import { Guard } from './guards';
import { Activity } from './activities';
import { Event } from './events';

/**
 * A transition can be defined as a target state and a command (or commands)
 * to execute before reaching the target state.
 */
export interface Transition<S extends string, E extends string> {
  target: S;
  command: Activity<E> | Activity<E>[];
}

/**
 * A guarded transition is defined by a target state, and a guard that
 * returns true if the transition should happen. It can optionally have a
 * command (or commands).
 */
export interface GuardedTransition<S extends string, E extends string, C> {
  target: S;
  guard: Guard<E, C>;
  command?: Activity<E> | Activity<E>[];
}

/**
 * A transition can be one of the following:
 * - just a state
 * - a target state and a command to execute
 * - a state and a guard, and an optional command
 * - more than one state and guard, with optional commands
 */
export type TransitionSpec<S extends string, K extends string, C = unknown> =
  | S
  | Transition<S, K>
  | GuardedTransition<S, K, C>
  | GuardedTransition<S, K, C>[];

/**
 * The transition map is a partial mapping between events and target states.
 * Transitions may have a command, and a guard.
 */
export type TransitionMap<E extends string, S extends string, C> = Partial<
  { [key in E]: TransitionSpec<S, key, C> }
>;

/**
 * A transition trigger contains information about a specific transition
 * from a specific state: it contains information about the event that
 * triggered the transition, the commands that must be executed, and the
 * state that must be reached.
 */
export interface TransitionTrigger<S extends string, E extends string> {
  event: Event<E>;
  nextState: S;
  command?: Activity<E> | Activity<E>[];
}

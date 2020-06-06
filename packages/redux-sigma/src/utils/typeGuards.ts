/**
 * Returns true if the parameter is an array. Also helps on type checking.
 * @param elem - The element that may be an array.
 */
import {
  Activity,
  GuardedTransition,
  ReactionSpec,
  StartedStmStorage,
  StmStorage,
  Transition,
  TransitionSpec,
} from '../types';

export function isArray<T>(elem: T | T[]): elem is T[] {
  return (elem as T[]) instanceof Array;
}

export function isStateTransition<S extends string, E extends string, C>(
  value: TransitionSpec<S, E, C>
): value is S {
  return typeof value === 'string';
}

export function isGuardedTransition<S extends string, E extends string, C>(
  value: TransitionSpec<S, E, C>
): value is GuardedTransition<S, E, C> {
  return 'guard' in value;
}

export function isGuardedTransitionArray<S extends string, E extends string, C>(
  value: TransitionSpec<S, E, C>
): value is GuardedTransition<S, E, C>[] {
  return value instanceof Array;
}

export function isSimpleTransition<S extends string, E extends string, C>(
  value: TransitionSpec<S, E, C>
): value is Transition<S, E> {
  return (
    !isStateTransition(value) &&
    !isGuardedTransition(value) &&
    !isGuardedTransitionArray(value)
  );
}

export function isReactionSpec<E extends string>(
  value: Activity<E> | ReactionSpec<E>
): value is ReactionSpec<E> {
  return 'policy' in value;
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isStarted<S extends string, C>(
  storage: StmStorage<S, C>
): storage is StartedStmStorage<S, C> {
  return storage.state !== null;
}

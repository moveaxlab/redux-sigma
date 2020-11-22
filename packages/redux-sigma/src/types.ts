/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action } from 'redux';
import { Saga } from 'redux-saga';
import {
  REACTION_POLICY_ALL,
  REACTION_POLICY_FIRST,
  REACTION_POLICY_LAST,
  startStmActionType,
  stopStmActionType,
  storeStmContextActionType,
  storeStmStateActionType,
} from './constants';
import { StrictEffect } from 'redux-saga/effects';

export type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

// An event without payload
export interface Event<T extends string> extends Action<T> {
  type: T;
}

// An event with generic payload
export interface PayloadEvent<T extends string> extends Event<T> {
  payload: any;
}

// An error event (FSA compliant)
export interface ErrorEvent<T extends string> extends Event<T> {
  payload: Error;
  error: true;
}

export type AnyEvent<T extends string = string> =
  | Event<T>
  | PayloadEvent<T>
  | ErrorEvent<T>;

/**
 * An activity that takes no input
 */
export type VoidActivity = Saga<[]> | ((...args: []) => void);

/**
 * An activity that takes an event as input
 */
export type Activity<K extends string> =
  | Saga<[Event<K>]>
  | Saga<[PayloadEvent<K>]>
  | Saga<[ErrorEvent<K>]>
  | Saga<[]>
  | ((...args: [Event<K>]) => void)
  | ((...args: [PayloadEvent<K>]) => void)
  | ((...args: [ErrorEvent<K>]) => void);

/**
 * A guard is a boolean function that takes in input an event and the
 * current context of the STM.
 */
export type Guard<K extends string, C> =
  | ((...args: [Event<K>, DeepReadonly<C>]) => boolean)
  | ((...args: [PayloadEvent<K>, DeepReadonly<C>]) => boolean)
  | ((...args: [ErrorEvent<K>, DeepReadonly<C>]) => boolean);

/**
 * A transition can be defined as a target state and a command to execute
 * before reaching the target state.
 */
export interface Transition<S extends string, E extends string> {
  target: S;
  command: Activity<E> | Activity<E>[];
}

/**
 * A guarded transition is defined by a target state, and a guard that
 * returns true if the transition should happen. It can optionally have a
 * command.
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
 *
 * A state can define more than one guard for a given event; a guard is a
 * boolean function, that takes in input the event and the current context
 * of the STM. If more than one guard is defined for a given event, the
 * modeller has the responsibility of ensuring that no two guards may ever
 * overlap (return true for a given event and context); not ensuring this
 * may result in non-deterministic transitions in the STM.
 */
export type TransitionMap<E extends string, S extends string, C> = Partial<
  { [key in E]: TransitionSpec<S, key, C> }
>;

export type ReactionPolicy =
  | typeof REACTION_POLICY_FIRST
  | typeof REACTION_POLICY_LAST
  | typeof REACTION_POLICY_ALL;

export interface ReactionSpec<E extends string> {
  activity: Activity<E>;
  policy: ReactionPolicy;
}

// The reaction map is a partial mapping between events and commands to run
// when the event happens.
export type ReactionMap<E extends string> = Partial<
  { [key in E]: Activity<key> | ReactionSpec<key> }
>;

export interface StartStateMachineAction<N extends string, C>
  extends Action<typeof startStmActionType> {
  payload: {
    name: N;
    context: C;
  };
}

export interface StopStateMachineAction<N extends string>
  extends Action<typeof stopStmActionType> {
  payload: {
    name: N;
  };
}

export interface StoreStateMachineState<N extends string, S extends string>
  extends Action<typeof storeStmStateActionType> {
  payload: {
    name: N;
    state: S;
  };
}

export interface StoreStateMachineContext<N extends string, C>
  extends Action<typeof storeStmContextActionType> {
  payload: {
    name: N;
    context: C;
  };
}

export interface StateMachineInterface<SM extends string, C> {
  name: SM;
  starterSaga: () => Generator<StrictEffect, void>;
  start: (ctx: C) => StartStateMachineAction<SM, C>;
  stop: () => StopStateMachineAction<SM>;
}

export interface SubStateMachineWithoutContext<SM extends string>
  extends StateMachineInterface<SM, {}> {}

// A state is described by its onEntry and onExit activities, by its sub
// machines (represented by their names), and by its transitions and reactions.
export type StateAttributes<
  E extends string,
  S extends string,
  SM extends string,
  C
> = Partial<{
  onEntry: VoidActivity | VoidActivity[];
  onExit: VoidActivity | VoidActivity[];
  subMachines:
    | SubStateMachineWithoutContext<SM>
    | SubStateMachineWithoutContext<SM>[];
  transitions: TransitionMap<E, S, C>;
  reactions: ReactionMap<E>;
}>;

// A STM spec is the description of each state of the STM.
export type StateMachineSpec<
  E extends string,
  S extends string,
  SM extends string,
  C
> = { [key in S]: StateAttributes<E, S, SM, C> };

export interface StoppedStmStorage {
  state: null;
  context: undefined;
}

export interface StartedStmStorage<S extends string, C> {
  state: S;
  context: C;
}

export type StmStorage<S extends string, C> =
  | StartedStmStorage<S, C>
  | StoppedStmStorage;

/**
 * This is the state and context of a state machine that is not running.
 */
export interface StoppedStmStorage {
  state: null;
  context: undefined;
}

/**
 * This is the state and context of a state machine that IS running.
 */
export interface StartedStmStorage<S extends string, C> {
  state: S;
  context: C;
}

/**
 * The actual state and context of a state machine.
 */
export type StmStorage<S extends string, C> =
  | StartedStmStorage<S, C>
  | StoppedStmStorage;

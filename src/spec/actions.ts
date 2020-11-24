import { Action } from 'redux';
import {
  startStmActionType,
  stopStmActionType,
  storeStmContextActionType,
  storeStmStateActionType,
} from '../constants';

/**
 * This type defines the action that can start the state machine.
 * It contains the state machine identifier (its name),
 * and the initial context for that state machine.
 */
export interface StartStateMachineAction<N extends string, C>
  extends Action<typeof startStmActionType> {
  payload: {
    name: N;
    context: C;
  };
}

/**
 * This type defines the action that can stop the state machine.
 * It contains the state machine identifier (its name).
 */
export interface StopStateMachineAction<N extends string>
  extends Action<typeof stopStmActionType> {
  payload: {
    name: N;
  };
}

/**
 * This type defines the action that will update the state of the state machine
 * stored inside its `stateReducer`.
 * It contains the state machine identifier (its name),
 * and the new state that will be stored.
 */
export interface StoreStateMachineState<N extends string, S extends string>
  extends Action<typeof storeStmStateActionType> {
  payload: {
    name: N;
    state: S;
  };
}

/**
 * This type defines the action that will update the context of the state machine
 * stored inside its `stateReducer`.
 * It contains the state machine identifier (its name),
 * and the new context that will be stored.
 */
export interface StoreStateMachineContext<N extends string, C>
  extends Action<typeof storeStmContextActionType> {
  payload: {
    name: N;
    context: C;
  };
}

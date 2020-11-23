/* eslint-disable @typescript-eslint/no-explicit-any */
import { call, fork, takeEvery } from 'redux-saga/effects';
import {
  startStmActionType,
  stopStmActionType,
  storeStmContextActionType,
  storeStmStateActionType,
} from './constants';
import { StateMachineInterface } from './types';
import { AnyAction } from 'redux';

/* istanbul ignore next */
/**
 * Prints a warning when an unknown STM is started or stopped.
 * @param action - The start/stop action that was dispatched.
 */
function* reportUnknownStateMachine(action: AnyAction) {
  // eslint-disable-next-line no-console
  yield call(console.warn, `Unkwnown state machine ${action.payload.name}`);
}

/**
 * Creates a saga that starts and stops STMs in response to
 * startStateMachine and stopStateMachine actions dispatched to redux. A STM
 * cannot be started more than once.
 * @param stms - An array of StateMachine instances.
 */
export function* stateMachineStarterSaga(
  ...stms: StateMachineInterface<any, any>[]
) {
  const duplicateStm = stms
    .map(stm => stm.name)
    .find((name, idx, arr) => arr.lastIndexOf(name) !== idx);

  /* istanbul ignore next */
  if (duplicateStm) {
    throw new Error(`Duplicate STM detected with name ${duplicateStm}`);
  }

  for (const stm of stms) {
    yield fork([stm, stm.starterSaga]);
  }

  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    const stmNames = stms.map(stm => stm.name);
    yield takeEvery(
      (action: AnyAction) =>
        action.payload &&
        action.payload.name &&
        [
          startStmActionType,
          stopStmActionType,
          storeStmContextActionType,
          storeStmStateActionType,
        ].includes(action.type) &&
        !stmNames.includes(action.payload.name),
      reportUnknownStateMachine
    );
  }
}

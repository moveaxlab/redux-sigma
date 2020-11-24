/* eslint-disable @typescript-eslint/no-explicit-any */
import { call, fork, takeEvery } from 'redux-saga/effects';
import {
  startStmActionType,
  stopStmActionType,
  storeStmContextActionType,
  storeStmStateActionType,
} from './constants';
import { AnyAction } from 'redux';
import { StateMachineInterface } from './spec/base';

/* istanbul ignore next */
function* reportUnknownStateMachine(action: AnyAction) {
  // eslint-disable-next-line no-console
  yield call(console.warn, `Unkwnown state machine ${action.payload.name}`);
}

/**
 * Creates a saga that runs the `starterSaga` for the state machines
 * given in input.
 *
 * It does some additional checks for you:
 *
 * - if two or more state machines have the same identifier (their name),
 *   this saga throws an error, since running more than one instance of
 *   the same state machine _will_ result in undefined behaviour
 * - if you try to start or stop a state machine that was not passed
 *   to this saga, it will log an error in console (in development only)
 *
 * @param stms An array of StateMachine instances.
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

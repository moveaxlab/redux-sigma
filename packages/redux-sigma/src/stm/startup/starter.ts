/* eslint-disable @typescript-eslint/no-explicit-any */
import { fork, takeEvery } from 'redux-saga/effects';
import {
  startStmActionType,
  stopStmActionType,
  storeStmContextActionType,
  storeStmStateActionType,
} from '../../constants';
import { StateMachineInterface } from '../../types';
import { reportUnknownStateMachine } from './report';
import { AnyAction } from 'redux';

export class DuplicateStateMachineError extends Error {
  constructor(stmName: string) {
    super(`Duplicate STM detected with name ${stmName}`);
    this.constructor = DuplicateStateMachineError;
    Object.setPrototypeOf(this, DuplicateStateMachineError.prototype);
  }
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
  const dupeStm = stms
    .map(stm => stm.name)
    .find((name, idx, arr) => arr.lastIndexOf(name) !== idx);
  if (dupeStm) {
    throw new DuplicateStateMachineError(dupeStm);
  }
  for (const stm of stms) {
    yield fork([stm, stm.starterSaga]);
  }
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

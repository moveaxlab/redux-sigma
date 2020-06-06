import { call } from 'redux-saga/effects';
import { AnyAction } from 'redux';

/**
 * Prints a warning when an unknown STM is started or stopped.
 * @param action - The start/stop action that was dispatched.
 */
export function* reportUnknownStateMachine(action: AnyAction) {
  // eslint-disable-next-line no-console
  yield call(console.warn, `Unkwnown state machine ${action.payload.name}`);
}

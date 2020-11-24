import { StrictEffect } from 'redux-saga/effects';
import { StartStateMachineAction, StopStateMachineAction } from './actions';

/**
 * This is the public interface for a state machine.
 * It removes private and protected fields, and can be used by other libraries.
 */
export interface StateMachineInterface<SM extends string, C> {
  name: SM;
  starterSaga: () => Generator<StrictEffect, void>;
  start: (ctx: C) => StartStateMachineAction<SM, C>;
  stop: () => StopStateMachineAction<SM>;
}

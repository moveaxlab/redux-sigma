/* eslint-disable @typescript-eslint/no-explicit-any */
import { StrictEffect } from 'redux-saga/effects';
import { StartStateMachineAction, StopStateMachineAction } from './actions';
import { StmStorage } from './storage';

/**
 * This is the public interface for a state machine.
 * It removes private and protected fields, and can be used by other libraries.
 */
export interface StateMachineInterface<S extends string, SM extends string, C> {
  name: SM;
  starterSaga: () => Generator<StrictEffect, void>;
  stateReducer: (
    state: StmStorage<S, C> | undefined,
    action: any
  ) => StmStorage<S, C>;
  start: (ctx: C) => StartStateMachineAction<SM, C>;
  stop: () => StopStateMachineAction<SM>;
}

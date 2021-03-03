/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateMachineInterface } from './base';
import { StrictEffect } from 'redux-saga/effects';

/**
 * This is a state machine that can be used as a sub state machine
 * without providing an initial context, since an empty object
 * can be assigned to its context.
 */
export interface SubStateMachineWithoutContext<SM extends string>
  extends StateMachineInterface<any, SM, {}> {}

/**
 * This is a state machine that can only be used as a sub state machine
 * by providing an initial context, since an empty object may not be
 * assignable to its context.
 *
 * The `contextBuilder` field is a function or generator that will return
 * the initial context for this state machine.
 */
export interface SubStateMachineWithContext<SM extends string, SC = any> {
  stm: StateMachineInterface<any, SM, SC>;
  contextBuilder: (() => SC) | (() => Generator<StrictEffect, SC>);
}

/**
 * This is any state machine that can be used as a sub state machine.
 */
export type SubStateMachine<SM extends string> =
  | SubStateMachineWithContext<SM>
  | SubStateMachineWithoutContext<SM>;

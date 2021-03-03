/* eslint-disable @typescript-eslint/no-explicit-any */
import { StrictEffect } from 'redux-saga/effects';
import { StateMachineInterface } from './spec/base';
import { SubStateMachineWithContext } from './spec/subMachines';

/**
 * Helper function to bind a sub STM to a context builder function.
 * The context builder function is responsible for creating the initial context
 * for the sub STM.
 *
 * This is just some TypeScript magic (aka inference) to make sure that
 * the sub state machine context contract is respected.
 *
 * @param stm the sub state machine to start
 * @param contextBuilder a function or saga that returns
 * the initial context for `stm`
 *
 * @returns a sub state machine with context descriptor,
 * used inside another STM spec
 */
export function bindStm<SM extends string = string, SC = unknown>(
  stm: StateMachineInterface<any, SM, SC>,
  contextBuilder: (() => SC) | (() => Generator<StrictEffect, SC>)
): SubStateMachineWithContext<SM, SC> {
  return {
    stm,
    contextBuilder,
  };
}

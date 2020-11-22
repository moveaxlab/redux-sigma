import { StrictEffect } from 'redux-saga/effects';
import { StateMachineInterface, SubStateMachineWithContext } from '../types';

/**
 * Helper function to bind a sub STM to a context builder function.
 * The context builder function is responsible for creating the initial context
 * for the sub STM.
 *
 * @param stm the sub STM to start
 * @param contextBuilder a function or saga that returns the initial context for `stm`
 *
 * @returns a sub STM with context descriptor, used inside another STM spec
 */
export function bindStm<SM extends string = string, SC = unknown>(
  stm: StateMachineInterface<SM, SC>,
  contextBuilder: (() => SC) | (() => Generator<StrictEffect, SC>)
): SubStateMachineWithContext<SM, SC> {
  return {
    stm,
    contextBuilder,
  };
}

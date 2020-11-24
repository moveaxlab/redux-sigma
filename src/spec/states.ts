import { VoidActivity } from './activities';
import { SubStateMachine } from './subMachines';
import { TransitionMap } from './transitions';
import { ReactionMap } from './reactions';

/**
 * Each state definition can contain the following fields:
 *
 * - what to do onEntry and onExit
 * - which subMachines to run when inside the state
 * - the possible transitions for the state
 * - the reactions for the state
 */
export interface StateAttributes<
  E extends string,
  S extends string,
  SM extends string,
  C
> {
  onEntry?: VoidActivity | VoidActivity[];
  onExit?: VoidActivity | VoidActivity[];
  subMachines?: SubStateMachine<SM> | SubStateMachine<SM>[];
  transitions?: TransitionMap<E, S, C>;
  reactions?: ReactionMap<E>;
}

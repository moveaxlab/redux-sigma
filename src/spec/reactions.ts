import { Activity } from './activities';
import {
  REACTION_POLICY_ALL,
  REACTION_POLICY_FIRST,
  REACTION_POLICY_LAST,
} from '../constants';

/**
 * A reaction policy determines what the state machine will do when a reaction
 * is triggered several times during a short period of time.
 */
export type ReactionPolicy =
  | typeof REACTION_POLICY_FIRST
  | typeof REACTION_POLICY_LAST
  | typeof REACTION_POLICY_ALL;

/**
 * This type defines what a reaction looks like when a reaction policy
 * is specified explicitly.
 */
export interface ReactionSpec<E extends string> {
  activity: Activity<E>;
  policy: ReactionPolicy;
}

/**
 * The reaction map is a partial mapping between possible events and
 * the commands to run when the event happens.
 */
export type ReactionMap<E extends string> = Partial<
  { [key in E]: Activity<key> | ReactionSpec<key> }
>;

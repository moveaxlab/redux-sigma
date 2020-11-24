import {
  REACTION_POLICY_ALL,
  REACTION_POLICY_FIRST,
  REACTION_POLICY_LAST,
} from './constants';
import { Activity } from './spec/activities';
import { ReactionSpec } from './spec/reactions';

/**
 * Instructs redux-sigma to use the `all` reaction policy for the input activity.
 *
 * @param activity An activity.
 */
export function all<K extends string>(activity: Activity<K>): ReactionSpec<K> {
  return {
    activity,
    policy: REACTION_POLICY_ALL,
  };
}

/**
 * Instructs redux-sigma to use the `last` reaction policy for the input activity.
 *
 * @param activity An activity.
 */
export function last<K extends string>(activity: Activity<K>): ReactionSpec<K> {
  return {
    activity,
    policy: REACTION_POLICY_LAST,
  };
}

/**
 * Instructs redux-sigma to use the `first` reaction policy for the input activity.
 *
 * @param activity An activity.
 */
export function first<K extends string>(
  activity: Activity<K>
): ReactionSpec<K> {
  return {
    activity,
    policy: REACTION_POLICY_FIRST,
  };
}

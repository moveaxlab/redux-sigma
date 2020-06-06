import { Activity, ReactionSpec } from '../types';
import { REACTION_POLICY_ALL, REACTION_POLICY_FIRST, REACTION_POLICY_LAST } from '../constants';

export function all<K extends string>(activity: Activity<K>): ReactionSpec<K> {
  return {
    activity,
    policy: REACTION_POLICY_ALL,
  };
}

export function last<K extends string>(activity: Activity<K>): ReactionSpec<K> {
  return {
    activity,
    policy: REACTION_POLICY_LAST,
  };
}

export function first<K extends string>(
  activity: Activity<K>
): ReactionSpec<K> {
  return {
    activity,
    policy: REACTION_POLICY_FIRST,
  };
}

import { Saga } from 'redux-saga';
import { ErrorEvent, Event, PayloadEvent } from './events';

/**
 * An activity that takes no input
 */
export type VoidActivity = Saga<[]> | ((...args: []) => void);

/**
 * An activity that takes an event as input
 */
export type Activity<K extends string> =
  | Saga<[Event<K>]>
  | Saga<[PayloadEvent<K>]>
  | Saga<[ErrorEvent<K>]>
  | Saga<[]>
  | ((...args: [Event<K>]) => void)
  | ((...args: [PayloadEvent<K>]) => void)
  | ((...args: [ErrorEvent<K>]) => void);

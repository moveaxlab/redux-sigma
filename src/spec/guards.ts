import { ErrorEvent, Event, PayloadEvent } from './events';

/**
 * A guard is a boolean function that takes in input an event and the
 * current context of the STM.
 */
export type Guard<K extends string, C> =
  | ((...args: [Event<K>, C]) => boolean)
  | ((...args: [PayloadEvent<K>, C]) => boolean)
  | ((...args: [ErrorEvent<K>, C]) => boolean);

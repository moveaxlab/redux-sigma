/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action } from 'redux';

/**
 * An event without payload
 */
export interface Event<T extends string> extends Action<T> {
  type: T;
}

/**
 * An event with generic payload
 */
export interface PayloadEvent<T extends string> extends Event<T> {
  payload: any;
}

/**
 * An error event (FSA compliant)
 */
export interface ErrorEvent<T extends string> extends Event<T> {
  payload: Error;
  error: true;
}

/**
 * All events that can be handled by a state machine
 */
export type AnyEvent<T extends string = string> =
  | Event<T>
  | PayloadEvent<T>
  | ErrorEvent<T>;

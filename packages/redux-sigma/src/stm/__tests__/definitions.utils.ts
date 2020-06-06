export enum StateMachineNames {
  heavy = 'state-machine/heavy',
  delayed = 'state-machine/delayed',
  testFirst = 'state-machine/test-first',
  testAll = 'state-machine/test-all',
  testLast = 'state-machine/test-last',
  base = 'state-machine/base',
  basesub = 'state-machine/basesub',
  guarded = 'state-machine/guarded',
  firstSubStm = 'state-machine/first-sub',
  secondSubStm = 'state-machine/second-sub',
  nestedStm = 'state-machine/nested',
}

export enum States {
  first = 'state:first',
  second = 'state:second',
  third = 'state:third',
}

export enum Events {
  first = 'event:first',
  second = 'event:second',
  simple = 'event:simple',
  payload = 'event:payload',
  error = 'event:error',
}

export const defaultPayload = {
  condition: false,
};

export type Payload = typeof defaultPayload;

export const firstEvent = () => {
  return { type: Events.first };
};
export const secondEvent = () => {
  return { type: Events.second };
};
export const simpleEvent = () => {
  return { type: Events.simple };
};

export const payloadEvent = (payload?: Partial<Payload>) => {
  return {
    type: Events.payload,
    payload: Object.assign({ ...defaultPayload }, payload),
  };
};

export const errorEvent = (error?: Error) => {
  return {
    type: Events.error,
    payload: error ? error : new Error('default error event'),
  };
};

export default {
  StateMachineNames,
  Events,
  States,
  defaultPayload,
  firstEvent,
  secondEvent,
  simpleEvent,
  payloadEvent,
  errorEvent,
};

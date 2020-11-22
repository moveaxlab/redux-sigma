/* eslint-disable-next-line max-classes-per-file */
import { StateMachine } from '../StateMachine';
import { Events, StateMachineNames, States } from './definitions.utils';
import { put, delay, call } from '@redux-saga/core/effects';
import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import waitForExpect from 'wait-for-expect';
import { stateMachineStarterSaga } from '../startup';
import { first, last, all } from '../..';

async function work(): Promise<void> {
  for (let i = 0; i <= 1000000; i++) {
    if (i == 1000000 - Math.floor(Math.random())) {
      break;
    }
  }
}

function* heavy(event?: PayloadEvent) {
  const payload = event ? event.payload : undefined;
  yield call(work);
  yield put({ type: 'HEAVY', payload });
}

function* delayed(event?: PayloadEvent) {
  const payload = event ? event.payload : undefined;
  yield delay(100);
  yield put({ type: 'DELAYED', payload });
}

abstract class AbstractTestStm extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;
}

function payloadEvent(payload: number) {
  return {
    type: Events.payload,
    payload,
  };
}

function* putSomeAction() {
  yield put({ type: Events.simple });
}

type PayloadEvent = ReturnType<typeof payloadEvent>;

class StmTestHeavyFirst extends AbstractTestStm {
  name = StateMachineNames.heavy;

  readonly spec = {
    [States.first]: {
      reactions: {
        [Events.payload]: first(heavy),
      },
      transitions: {
        [Events.first]: States.second,
      },
    },
    [States.second]: {
      reactions: {
        [Events.payload]: putSomeAction,
      },
    },
    [States.third]: {},
  };
}

class StmTestHeavyLast extends AbstractTestStm {
  name = StateMachineNames.heavy;

  readonly spec = {
    [States.first]: {
      reactions: {
        [Events.payload]: last(heavy),
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

class StmTestHeavyAll extends AbstractTestStm {
  name = StateMachineNames.heavy;

  readonly spec = {
    [States.first]: {
      reactions: {
        [Events.payload]: heavy,
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

class StmTestDelayedFirst extends AbstractTestStm {
  name = StateMachineNames.delayed;

  readonly spec = {
    [States.first]: {
      reactions: {
        [Events.payload]: first(delayed),
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

class StmTestDelayedLast extends AbstractTestStm {
  name = StateMachineNames.delayed;

  readonly spec = {
    [States.first]: {
      reactions: {
        [Events.payload]: last(delayed),
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

class StmTestDelayedAll extends AbstractTestStm {
  name = StateMachineNames.delayed;

  readonly spec = {
    [States.first]: {
      reactions: {
        [Events.payload]: all(delayed),
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

interface Context {
  n: number;
}

class StmWithContext extends StateMachine<
  Events,
  States,
  StateMachineNames,
  Context
> {
  name = StateMachineNames.base;

  protected initialState = States.first;

  readonly spec = {
    [States.first]: {
      reactions: {
        [Events.first]: all(this.doSomethingWithContext),
        [Events.second]: last(this.doSomethingWithContext),
        [Events.simple]: first(this.doSomethingWithContext),
      },
    },
    [States.second]: {},
    [States.third]: {},
  };

  *doSomethingWithContext() {
    yield* this.setContext({ n: this.context.n + 1 });
    yield put({ type: 'context_updated', payload: this.context.n });
  }
}

describe('Test reaction policies', () => {
  describe('Test TakeFirst policy', () => {
    it('tests that reactions stop when changing states', async () => {
      const stm = new StmTestHeavyFirst();
      const reducers = combineReducers({
        [stm.name]: stm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, stm);
      tester.dispatch(stm.start({}));
      tester.dispatch(payloadEvent(1));
      await tester.waitFor('HEAVY');
      tester.dispatch({ type: Events.first });
      await waitForExpect(() => {
        expect(tester.getState()[stm.name].state).toBe(States.second);
      });
      tester.dispatch(payloadEvent(1));
      await tester.waitFor(Events.simple);
      await waitForExpect(() => {
        expect(tester.numCalled('HEAVY')).toBe(1);
      });
    });

    it('shall work on delay', async () => {
      jest.useFakeTimers();
      const delayedStm = new StmTestDelayedFirst();
      const reducers = combineReducers({
        [delayedStm.name]: delayedStm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, delayedStm);
      tester.dispatch(delayedStm.start({}));
      for (let i = 0; i < 3; i++) {
        tester.dispatch(payloadEvent(i));
      }
      jest.advanceTimersByTime(100); //let saga run
      await tester.waitFor('DELAYED'); //wait for saga to be done
      jest.advanceTimersByTime(100); //check no pending action will be executed
      await waitForExpect(() => {
        const actions = tester.getCalledActions();
        const events = actions.filter(action => action.type == Events.payload);
        const delayedEvents = actions.filter(
          action => action.type == 'DELAYED'
        );
        expect(events.length).toEqual(3);
        expect(delayedEvents.length).toEqual(1);
      });
      for (let i = 0; i < 3; i++) {
        tester.dispatch(payloadEvent(i));
      }
      jest.advanceTimersByTime(100); //let saga run
      await tester.waitFor('DELAYED'); //wait for saga to be done
      jest.advanceTimersByTime(100); //check no pending action will be executed
      await waitForExpect(() => {
        const actions = tester.getCalledActions();
        const events = actions.filter(action => action.type == Events.payload);
        const delayedEvents = actions.filter(
          action => action.type == 'DELAYED'
        );
        expect(events.length).toEqual(6);
        expect(delayedEvents.length).toEqual(2);
        expect(delayedEvents.map(e => e.payload)).toEqual([0, 0]);
      });
      jest.clearAllMocks();
    });

    it('shall work on heavy', async () => {
      const heavyStm = new StmTestHeavyFirst();
      const reducers = combineReducers({
        [heavyStm.name]: heavyStm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, heavyStm);
      tester.dispatch(heavyStm.start({}));
      for (let i = 0; i < 50; i++) {
        //enqueue multiple events
        tester.dispatch(payloadEvent(i));
      }

      await tester.waitFor('HEAVY'); //wait for at least one reaction to be done
      for (let i = 0; i < 50; i++) {
        //enqueue multiple events
        tester.dispatch(payloadEvent(i));
      }
      await tester.waitFor('HEAVY'); //wait for at least a second reaction to be done
      await waitForExpect(() => {
        const actions = tester.getCalledActions();
        const events = actions.filter(action => action.type == Events.payload);
        const heavyEvents = actions.filter(action => action.type == 'HEAVY');
        expect(events.length).toEqual(100);
        expect(heavyEvents.length).toEqual(2);
        expect(heavyEvents.map(e => e.payload)).toEqual([0, 0]);
      });
      tester.dispatch(heavyStm.stop());
    });
  });

  describe('Test TakeLast policy', () => {
    it('shall work on delay', async () => {
      jest.useFakeTimers();
      const delayedStm = new StmTestDelayedLast();
      const reducers = combineReducers({
        [delayedStm.name]: delayedStm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, delayedStm);
      tester.dispatch(delayedStm.start({}));
      for (let i = 0; i < 3; i++) {
        tester.dispatch(payloadEvent(i));
      }
      jest.advanceTimersByTime(100); //let saga run
      await tester.waitFor('DELAYED'); //wait for saga to be done
      await waitForExpect(() => {
        const actions = tester.getCalledActions();
        const events = actions.filter(action => action.type == Events.payload);
        const delayedEvents = actions.filter(
          action => action.type == 'DELAYED'
        );
        expect(events.length).toEqual(3);
        expect(delayedEvents.length).toEqual(1);
        expect(delayedEvents[0]).toEqual({ type: 'DELAYED', payload: 2 });
      });
      jest.clearAllMocks();
    });

    it('shall work on heavy', async () => {
      const heavyStm = new StmTestHeavyLast();
      const reducers = combineReducers({
        [heavyStm.name]: heavyStm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, heavyStm);
      tester.dispatch(heavyStm.start({}));
      for (let i = 0; i < 50; i++) {
        //enqueue multiple events
        tester.dispatch(payloadEvent(i));
      }

      await tester.waitFor('HEAVY'); //wait for at least a second reaction to be done
      await waitForExpect(() => {
        const actions = tester.getCalledActions();
        const events = actions.filter(action => action.type == Events.payload);
        const heavyEvents = actions.filter(action => action.type == 'HEAVY');
        expect(events.length).toEqual(50);
        expect(heavyEvents.length).toEqual(1);
        expect(heavyEvents[0]).toEqual({ type: 'HEAVY', payload: 49 });
      });
      tester.dispatch(heavyStm.stop());
    });
  });

  describe('Test TakeAll policy', () => {
    it('shall work on delay', async () => {
      jest.useFakeTimers();
      const delayedStm = new StmTestDelayedAll();
      const reducers = combineReducers({
        [delayedStm.name]: delayedStm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, delayedStm);
      tester.dispatch(delayedStm.start({}));
      for (let i = 0; i < 50; i++) {
        tester.dispatch(payloadEvent(i));
      }

      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(100); //let saga run
        await tester.waitFor('DELAYED');
      }

      await waitForExpect(() => {
        const actions = tester.getCalledActions();
        const events = actions.filter(action => action.type == Events.payload);
        const delayedEvents = actions.filter(
          action => action.type == 'DELAYED'
        );
        expect(events.length).toEqual(50);
        expect(delayedEvents.length).toEqual(50);
      });
      jest.clearAllMocks();
    });

    it('shall work on heavy', async () => {
      const heavyStm = new StmTestHeavyAll();
      const reducers = combineReducers({
        [heavyStm.name]: heavyStm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, heavyStm);
      tester.dispatch(heavyStm.start({}));
      for (let i = 0; i < 2; i++) {
        //enqueue multiple events
        tester.dispatch(payloadEvent(i));
      }

      await tester.waitFor('HEAVY'); //wait for at least a second reaction to be done
      await waitForExpect(() => {
        const actions = tester.getCalledActions();
        const events = actions.filter(action => action.type == Events.payload);
        const heavyEvents = actions.filter(action => action.type == 'HEAVY');
        expect(events.length).toEqual(2);
        expect(heavyEvents.length).toEqual(2);
      });
      tester.dispatch(heavyStm.stop());
    });
  });

  describe('Test that this is passed around correctly', () => {
    it('tests this on reaction policy `all`', async () => {
      const stm = new StmWithContext();
      const reducers = combineReducers({
        [stm.name]: stm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, stm);
      tester.dispatch(stm.start({ n: 0 }));

      for (let i = 0; i < 20; i++) {
        tester.dispatch({ type: Events.first });
      }

      await waitForExpect(() => {
        const actions = tester
          .getCalledActions()
          .filter(a => a.type === 'context_updated');
        expect(actions.length).toBe(20);
        expect(actions.every((a, idx) => a.payload === idx + 1));
      });

      tester.dispatch(stm.stop());
    });

    it('tests this on reaction policy `first`', async () => {
      const stm = new StmWithContext();
      const reducers = combineReducers({
        [stm.name]: stm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, stm);
      tester.dispatch(stm.start({ n: 0 }));

      for (let i = 0; i < 20; i++) {
        tester.dispatch({ type: Events.second });
      }

      await waitForExpect(() => {
        const actions = tester
          .getCalledActions()
          .filter(a => a.type === 'context_updated');
        expect(actions.length).toBe(20);
        expect(actions.every((a, idx) => a.payload === idx + 1));
      });

      tester.dispatch(stm.stop());
    });

    it('tests this on reaction policy `last`', async () => {
      const stm = new StmWithContext();
      const reducers = combineReducers({
        [stm.name]: stm.stateReducer,
      });
      const tester = new SagaTester({ reducers });
      tester.start(stateMachineStarterSaga, stm);
      tester.dispatch(stm.start({ n: 0 }));

      for (let i = 0; i < 20; i++) {
        tester.dispatch({ type: Events.simple });
      }

      await waitForExpect(() => {
        const actions = tester
          .getCalledActions()
          .filter(a => a.type === 'context_updated');
        expect(actions.length).toBe(20);
        expect(actions.every((a, idx) => a.payload === idx + 1));
      });

      tester.dispatch(stm.stop());
    });
  });
});

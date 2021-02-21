import { StateMachine, stateMachineStarterSaga } from '../src';
import { call, put, take } from 'redux-saga/effects';
import { combineReducers, Middleware } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';

interface Context {
  run: number;
  triggerRun?: number;
}

interface Event2 {
  type: 'event_2';
  payload: {
    run: number;
  };
}

class SlowOnExitStm extends StateMachine<
  'event_1' | 'event_2',
  string,
  string,
  Context
> {
  protected readonly initialState = 'state_1';

  readonly name = 'slow on exit';

  protected readonly spec = {
    state_1: {
      onEntry: this.onEntry,
      onExit: this.onExit,
      transitions: {
        event_1: 'state_2',
        event_2: {
          target: 'state_3',
          command: this.storeTriggerRun,
        },
      },
    },
    state_2: {},
    state_3: {},
  };

  *onEntry() {
    yield take('go');
    yield call(async () => await Promise.resolve());
    yield put({ type: 'event_1' });
  }

  *onExit() {
    // execute a "slow" on exit by dispatching lots of actions to redux saga
    const currentRun = this.context.run;
    yield put({ type: 'on exit event 1', payload: { currentRun } });
    yield put({ type: 'on exit event 2', payload: { currentRun } });
    yield put({ type: 'on exit event 3', payload: { currentRun } });
    yield put({ type: 'on exit event 4', payload: { currentRun } });
    yield put({ type: 'event_2', payload: { currentRun } });
  }

  *storeTriggerRun(event: Event2) {
    yield* this.setContext(ctx => {
      ctx.triggerRun = event.payload.run;
    });
  }
}

describe('Slow on exit do not affect other states', () => {
  it('checks that slow on exit does not affect state change', async () => {
    const stm = new SlowOnExitStm();

    const reducers = combineReducers({
      stm: stm.stateReducer,
    });

    const tester = new SagaTester({ reducers });

    tester.start(stateMachineStarterSaga, stm);

    tester.dispatch(stm.start({ run: 1 }));
    tester.dispatch({ type: 'go' });
    expect(tester.getState().stm.state).toEqual('state_1');

    await tester.waitFor('event_1');

    // event 2 was received, but does not trigger a transition to state_3
    await tester.waitFor('event_2');

    expect(tester.getState().stm.state).toEqual('state_2');
  });

  it('checks that slow on exit does not affect state machine restart', async () => {
    const stm = new SlowOnExitStm();

    const reducers = combineReducers({
      stm: stm.stateReducer,
    });

    let run = 0;
    let firstRun = true;

    const middleware: Middleware = store => next => action => {
      const res = next(action);
      if (action.type === 'go' && firstRun) {
        store.dispatch(stm.stop());
        store.dispatch(stm.start({ run: ++run }));
        firstRun = false;
      }
      return res;
    };

    const middlewares = [middleware];

    const tester = new SagaTester({
      reducers,
      middlewares,
    });

    tester.start(stateMachineStarterSaga, stm);

    tester.dispatch(stm.start({ run: ++run }));
    tester.dispatch({ type: 'go' });

    await tester.waitFor('event_2');

    expect(tester.getState().stm.state).toEqual('state_1');
  });

  it('checks that slow on exit does not affect state machine restart on transition', async () => {
    const stm = new SlowOnExitStm();

    const reducers = combineReducers({
      stm: stm.stateReducer,
    });

    let run = 0;
    let firstRun = true;

    const middleware: Middleware = store => next => action => {
      const res = next(action);
      if (action.type === 'event_1' && firstRun) {
        store.dispatch(stm.stop());
        store.dispatch(stm.start({ run: ++run }));
        firstRun = false;
      }
      return res;
    };

    const middlewares = [middleware];

    const tester = new SagaTester({
      reducers,
      middlewares,
    });

    tester.start(stateMachineStarterSaga, stm);

    tester.dispatch(stm.start({ run: ++run }));
    tester.dispatch({ type: 'go' });

    await tester.waitFor('event_2');

    expect(tester.getState().stm.state).toEqual('state_1');
  });
});

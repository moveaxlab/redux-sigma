import { StateMachine, stateMachineStarterSaga } from '../src';
import { storeStmContextActionType } from '../src/constants';
import { call, put } from 'redux-saga/effects';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { combineReducers, Middleware } from 'redux';
import waitForExpect from 'wait-for-expect';

async function loadData() {
  await Promise.resolve();
  return 'data';
}

interface Context {
  run: number;
  data?: string;
  loadRun?: number;
}

interface LoadAction {
  type: 'loaded';
  payload: {
    currentRun: number;
  };
}

type LoadActionType = LoadAction['type'];

class RestartStateMachine extends StateMachine<
  LoadActionType,
  string,
  string,
  Context
> {
  protected readonly initialState = 'loading';

  readonly name = 'restart';

  protected readonly spec = {
    loading: {
      onEntry: this.onEntry,
      transitions: {
        loaded: {
          target: 'loaded',
          command: this.storeRunTrigger,
        },
      },
    },
    loaded: {},
  };

  *onEntry() {
    const currentRun = this.context.run;
    const data = yield call(loadData);
    yield* this.setContext(ctx => {
      ctx.data = data;
    });
    yield put({ type: 'loaded', payload: { currentRun } });
  }

  *storeRunTrigger(action: LoadAction) {
    yield* this.setContext(ctx => {
      ctx.loadRun = action.payload.currentRun;
    });
  }
}

describe("Transition events from previous run don't trigger transition in new run", () => {
  it('checks that restarting before transition event does not affect new run', async () => {
    const stm = new RestartStateMachine();

    const reducers = combineReducers({
      stm: stm.stateReducer,
    });

    let count = 0;

    const restartMiddleware: Middleware = store => next => action => {
      const res = next(action);
      // restart STM right before the loaded event is dispatched
      if (action.type === storeStmContextActionType && count == 1) {
        store.dispatch(stm.stop());
        store.dispatch(stm.start({ run: ++count }));
      }
      return res;
    };

    const middlewares = [restartMiddleware];

    const tester = new SagaTester({
      reducers,
      middlewares,
    });

    tester.start(stateMachineStarterSaga, stm);

    tester.dispatch(stm.start({ run: ++count }));

    await waitForExpect(() => {
      expect(tester.getState().stm.state).toEqual('loaded');
    });

    const { context } = tester.getState().stm;

    expect(context!.run).toEqual(context!.loadRun);
    expect(tester.numCalled('loaded')).toEqual(2);
    expect(context!.data).toEqual('data');
  });

  it('checks that restarting on transition event does not affect new runs', async () => {
    const stm = new RestartStateMachine();

    const reducers = combineReducers({
      stm: stm.stateReducer,
    });

    let count = 0;

    const restartMiddleware: Middleware = store => next => action => {
      const res = next(action);
      // restart STM as soon as the loaded event is dispatched
      if (action.type === 'loaded' && count == 1) {
        store.dispatch(stm.stop());
        store.dispatch(stm.start({ run: ++count }));
      }
      return res;
    };

    const middlewares = [restartMiddleware];

    const tester = new SagaTester({
      reducers,
      middlewares,
    });

    tester.start(stateMachineStarterSaga, stm);

    tester.dispatch(stm.start({ run: ++count }));

    await waitForExpect(() => {
      expect(tester.getState().stm.state).toEqual('loaded');
    });

    const { context } = tester.getState().stm;

    expect(context!.run).toEqual(context!.loadRun);
    expect(tester.numCalled('loaded')).toEqual(2);
    expect(context!.data).toEqual('data');
  });
});

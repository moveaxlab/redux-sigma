import { StateMachine, stateMachineStarterSaga } from '../src';
import { put } from 'redux-saga/effects';
import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import {
  StoreStateMachineContext,
  StoreStateMachineState,
} from '../src/spec/actions';
import {
  storeStmContextActionType,
  storeStmStateActionType,
} from '../src/constants';

class SimpleStateMachine extends StateMachine {
  readonly name = 'simple_stm';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {
      onEntry: this.onEntry,
    },
  };

  *onEntry() {
    yield put({ type: 'stm_started' });
  }
}

const stateMachine = new SimpleStateMachine();

describe('Start and stop semantics', () => {
  const reducers = combineReducers({
    stateMachine: stateMachine.stateReducer,
  });

  const tester = new SagaTester({ reducers });
  tester.start(stateMachineStarterSaga, stateMachine);

  afterEach(() => {
    tester.dispatch(stateMachine.stop());
    tester.reset(true);
    jest.resetAllMocks();
  });

  test('state machines can be started and stopped', () => {
    expect(tester.getState().stateMachine.state).toEqual(null);

    tester.dispatch(stateMachine.start({}));

    expect(tester.getState().stateMachine.state).toEqual('state_1');

    tester.dispatch(stateMachine.stop());

    expect(tester.getState().stateMachine.state).toEqual(null);

    tester.dispatch(stateMachine.start({}));

    expect(tester.getState().stateMachine.state).toEqual('state_1');
  });

  test('multiple start actions start the state machine only once', () => {
    tester.dispatch(stateMachine.start({}));

    expect(tester.numCalled('stm_started')).toEqual(1);

    tester.dispatch(stateMachine.start({}));
    tester.dispatch(stateMachine.start({}));

    expect(tester.numCalled('stm_started')).toEqual(1);
  });

  test('multiple stop actions have no effect on the state machine', () => {
    tester.dispatch(stateMachine.stop());

    expect(tester.getState().stateMachine.state).toEqual(null);

    tester.dispatch(stateMachine.start({}));

    tester.dispatch(stateMachine.stop());
    tester.dispatch(stateMachine.stop());

    expect(tester.getState().stateMachine.state).toEqual(null);
  });

  test('state updates are ignored if the state machine is not running', () => {
    const event: StoreStateMachineState<string, string> = {
      type: storeStmStateActionType,
      payload: {
        name: stateMachine.name,
        state: 'state_1',
      },
    };

    tester.dispatch(event);

    expect(tester.getState().stateMachine.state).toEqual(null);
  });

  test('context updates are ignored if the state machine is not running', () => {
    const event: StoreStateMachineContext<string, {}> = {
      type: storeStmContextActionType,
      payload: {
        name: stateMachine.name,
        context: {},
      },
    };

    tester.dispatch(event);

    expect(tester.getState().stateMachine.context).toBeUndefined();
  });
});

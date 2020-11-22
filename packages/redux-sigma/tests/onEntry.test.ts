import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { StateMachine, stateMachineStarterSaga } from '../src';
import { put, delay, call } from 'redux-saga/effects';
import { combineReducers } from 'redux';

const spy1 = jest.fn();
const spy2 = jest.fn();
const spy3 = jest.fn();
const spy4 = jest.fn();
const spy5 = jest.fn();

class StateMachineWithOnEntry extends StateMachine {
  protected readonly initialState = 'state_1';

  readonly name = 'on_entry';

  protected readonly spec = {
    state_1: {
      onEntry: this.onEntry1,
      transitions: {
        go_to_state_2: 'state_2',
        go_to_state_3: 'state_3',
      },
    },
    state_2: {
      onEntry: spy3,
    },
    state_3: {
      onEntry: [spy4, spy5],
    },
  };

  *onEntry1() {
    yield call(spy1);
    // short delay to allow concurrent events
    yield delay(100);
    yield call(spy2);
    yield put({ type: 'on_entry_complete' });
  }
}

const stateMachine = new StateMachineWithOnEntry();

describe('onEntry semantics', () => {
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

  test('onEntry is called', async () => {
    tester.dispatch(stateMachine.start({}));

    // wait for on entry to complete
    await tester.waitFor('on_entry_complete');

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledAfter(spy1);
  });

  test('onEntry is interrupted when state machine is stopped', () => {
    tester.dispatch(stateMachine.start({}));

    // stop state machine right away
    tester.dispatch(stateMachine.stop());

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).not.toHaveBeenCalled();
  });

  test('onEntry is interrupted when state machine changes state', () => {
    tester.dispatch(stateMachine.start({}));

    // change state to stop onEntry
    tester.dispatch({ type: 'go_to_state_2' });

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledAfter(spy1);

    expect(tester.getState().stateMachine.state).toEqual('state_2');
  });

  test('multiple onEntry are all executed', () => {
    tester.dispatch(stateMachine.start({}));

    tester.dispatch({ type: 'go_to_state_3' });

    // both onEntry of state_3 have been executed
    expect(spy4).toHaveBeenCalledTimes(1);
    expect(spy5).toHaveBeenCalledTimes(1);

    expect(tester.getState().stateMachine.state).toEqual('state_3');
  });
});

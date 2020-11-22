import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { StateMachine, stateMachineStarterSaga } from '../src';
import { combineReducers } from 'redux';

const spy1 = jest.fn();
const spy2 = jest.fn();
const spy3 = jest.fn();

const onEntrySpy = jest.fn();

const commandSpy = jest.fn();

class StateMachineWithOnExit extends StateMachine {
  protected readonly initialState = 'state_1';

  readonly name = 'on_exit';

  protected readonly spec = {
    state_1: {
      transitions: {
        go_to_state_2: 'state_2',
        go_to_state_2_with_command: {
          target: 'state_2',
          command: commandSpy,
        },
      },
      onExit: spy1,
    },
    state_2: {
      onEntry: onEntrySpy,
      transitions: {
        go_to_state_1: 'state_1',
      },
      onExit: [spy2, spy3],
    },
  };
}

const stateMachine = new StateMachineWithOnExit();

describe('onExit semantics', () => {
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

  test('onExit is called when a transition happens', () => {
    tester.dispatch(stateMachine.start({}));

    tester.dispatch({ type: 'go_to_state_2' });

    expect(tester.getState().stateMachine.state).toEqual('state_2');

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy1).toHaveBeenCalledBefore(onEntrySpy);
  });

  test('onExit is called when a state machine is stopped', () => {
    tester.dispatch(stateMachine.start({}));

    tester.dispatch(stateMachine.stop());

    expect(tester.getState().stateMachine.state).toEqual(null);

    expect(spy1).toHaveBeenCalledTimes(1);
  });

  test('onExit is called before commands on transitions', () => {
    tester.dispatch(stateMachine.start({}));

    tester.dispatch({ type: 'go_to_state_2_with_command' });

    expect(tester.getState().stateMachine.state).toEqual('state_2');

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(commandSpy).toHaveBeenCalledTimes(1);
    expect(spy1).toHaveBeenCalledBefore(commandSpy);
    expect(commandSpy).toHaveBeenCalledBefore(onEntrySpy);
  });

  test('multiple onExit are all called', () => {
    tester.dispatch(stateMachine.start({}));

    tester.dispatch({ type: 'go_to_state_2' });

    expect(tester.getState().stateMachine.state).toEqual('state_2');

    tester.dispatch({ type: 'go_to_state_1' });

    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);
  });
});

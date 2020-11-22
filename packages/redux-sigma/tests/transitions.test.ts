import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { StateMachine, stateMachineStarterSaga } from '../src';
import { combineReducers } from 'redux';

const command1 = jest.fn();
const command2 = jest.fn();
const command3 = jest.fn();

const onEntrySpy = jest.fn();

const simpleGuard = jest.fn();
const simpleGuardCommand = jest.fn();

const combinedGuard1 = jest.fn();
const combinedGuardCommand1 = jest.fn();
const combinedGuard2 = jest.fn();
const combinedGuardCommand2 = jest.fn();

class StateMachineTransitions extends StateMachine {
  readonly name = 'transitions';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {
      transitions: {
        simple_transition: 'state_2',
        concurrent_transition: 'state_3',
        transition_with_command: {
          target: 'state_4',
          command: command1,
        },
        transition_with_multiple_commands: {
          target: 'state_4',
          command: [command2, command3],
        },
        guarded_transition: {
          guard: simpleGuard,
          target: 'state_2',
          command: simpleGuardCommand,
        },
        combined_guard: [
          {
            guard: combinedGuard1,
            target: 'state_2',
            command: combinedGuardCommand1,
          },
          {
            guard: combinedGuard2,
            target: 'state_3',
            command: combinedGuardCommand2,
          },
        ],
      },
    },
    state_2: {},
    state_3: {},
    state_4: {
      onEntry: onEntrySpy,
    },
  };
}

const stateMachine = new StateMachineTransitions();

describe('Transitions semantics', () => {
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

  test('only one transition is taken', () => {
    tester.dispatch(stateMachine.start({}));

    expect(tester.getState().stateMachine.state).toEqual('state_1');

    tester.dispatch({ type: 'simple_transition' });
    tester.dispatch({ type: 'concurrent_transition' });

    expect(tester.getState().stateMachine.state).toEqual('state_2');
  });

  test('a simple command is executed before entering the new state', () => {
    tester.dispatch(stateMachine.start({}));

    const event = { type: 'transition_with_command' };

    tester.dispatch(event);

    expect(tester.getState().stateMachine.state).toEqual('state_4');

    expect(command1).toHaveBeenCalledTimes(1);
    expect(command1).toHaveBeenCalledWith(event);

    expect(onEntrySpy).toHaveBeenCalledTimes(1);

    expect(command1).toHaveBeenCalledBefore(onEntrySpy);
  });

  test('multiple commands are executed before entering the new state', () => {
    tester.dispatch(stateMachine.start({}));

    const event = { type: 'transition_with_multiple_commands' };

    tester.dispatch(event);

    expect(tester.getState().stateMachine.state).toEqual('state_4');

    expect(command2).toHaveBeenCalledTimes(1);
    expect(command2).toHaveBeenCalledWith(event);

    expect(command3).toHaveBeenCalledTimes(1);
    expect(command3).toHaveBeenCalledWith(event);

    expect(onEntrySpy).toHaveBeenCalledTimes(1);

    expect(command2).toHaveBeenCalledBefore(onEntrySpy);
    expect(command3).toHaveBeenCalledBefore(onEntrySpy);
  });

  test('guarded transitions are executed only if the guard returns true', () => {
    tester.dispatch(stateMachine.start({}));

    const event = { type: 'guarded_transition' };

    simpleGuard.mockReturnValue(false);

    tester.dispatch(event);

    expect(tester.getState().stateMachine.state).toEqual('state_1');

    expect(simpleGuard).toHaveBeenCalledTimes(1);
    expect(simpleGuard).toHaveBeenCalledWith(event, stateMachine.context);

    expect(simpleGuardCommand).not.toHaveBeenCalled();

    simpleGuard.mockReset();
    simpleGuard.mockReturnValue(true);

    tester.dispatch(event);

    expect(tester.getState().stateMachine.state).toEqual('state_2');

    expect(simpleGuard).toHaveBeenCalledTimes(1);
    expect(simpleGuard).toHaveBeenCalledWith(event, stateMachine.context);

    expect(simpleGuardCommand).toHaveBeenCalledTimes(1);
    expect(simpleGuardCommand).toHaveBeenCalledWith(event);
  });

  test('only one guarded transition is taken if many are specified', () => {
    tester.dispatch(stateMachine.start({}));

    const event = { type: 'combined_guard' };

    combinedGuard1.mockReturnValue(false);
    combinedGuard2.mockReturnValue(false);

    tester.dispatch(event);

    expect(tester.getState().stateMachine.state).toEqual('state_1');

    expect(combinedGuard1).toHaveBeenCalledTimes(1);
    expect(combinedGuard2).toHaveBeenCalledTimes(1);
    expect(combinedGuard1).toHaveBeenCalledWith(event, stateMachine.context);
    expect(combinedGuard2).toHaveBeenCalledWith(event, stateMachine.context);

    expect(combinedGuardCommand1).not.toHaveBeenCalled();
    expect(combinedGuardCommand2).not.toHaveBeenCalled();

    jest.resetAllMocks();
    combinedGuard1.mockReturnValue(false);
    combinedGuard2.mockReturnValue(true);

    tester.dispatch(event);

    expect(tester.getState().stateMachine.state).toEqual('state_3');

    expect(combinedGuard2).toHaveBeenCalledTimes(1);
    expect(combinedGuard2).toHaveBeenCalledWith(event, stateMachine.context);

    expect(combinedGuardCommand1).not.toHaveBeenCalled();
    expect(combinedGuardCommand2).toHaveBeenCalledTimes(1);
    expect(combinedGuardCommand2).toHaveBeenCalledWith(event);
  });
});

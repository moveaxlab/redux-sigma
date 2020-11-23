/* eslint-disable max-classes-per-file */
import { StateMachine, stateMachineStarterSaga } from '../src';
import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { startStmActionType, stopStmActionType } from '../src/constants';

class FirstSubMachine extends StateMachine {
  readonly name = 'sub_1';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {},
  };
}

const firstSubMachine = new FirstSubMachine();

class SecondSubMachine extends StateMachine {
  readonly name = 'sub_2';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {},
  };
}

const secondSubMachine = new SecondSubMachine();

class ParentMachine extends StateMachine {
  readonly name = 'parent';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {
      subMachines: [firstSubMachine, secondSubMachine],
      transitions: {
        change_state: 'state_2',
      },
    },
    state_2: {
      subMachines: firstSubMachine,
      transitions: {
        change_state: 'state_3',
      },
    },
    state_3: {},
  };
}

const parentStateMachine = new ParentMachine();

describe('Sub state machines semantics', () => {
  const reducers = combineReducers({
    parent: parentStateMachine.stateReducer,
    firstSub: firstSubMachine.stateReducer,
    secondSub: secondSubMachine.stateReducer,
  });

  const tester = new SagaTester({ reducers });
  tester.start(
    stateMachineStarterSaga,
    parentStateMachine,
    firstSubMachine,
    secondSubMachine
  );

  afterEach(() => {
    tester.dispatch(parentStateMachine.stop());
    tester.reset(true);
    jest.resetAllMocks();
  });

  test('sub state machines are started and stopped with their parent', () => {
    expect(tester.getState().parent.state).toEqual(null);
    expect(tester.getState().firstSub.state).toEqual(null);
    expect(tester.getState().secondSub.state).toEqual(null);

    tester.dispatch(parentStateMachine.start({}));

    expect(tester.getState().parent.state).toEqual('state_1');
    expect(tester.getState().firstSub.state).toEqual('state_1');
    expect(tester.getState().secondSub.state).toEqual('state_1');

    expect(tester.numCalled(startStmActionType)).toEqual(3);

    tester.dispatch(parentStateMachine.stop());

    expect(tester.getState().parent.state).toEqual(null);
    expect(tester.getState().firstSub.state).toEqual(null);
    expect(tester.getState().secondSub.state).toEqual(null);

    expect(tester.numCalled(stopStmActionType)).toEqual(3);
  });

  test('transitions change the running sub machines', () => {
    tester.dispatch(parentStateMachine.start({}));

    expect(tester.getState().parent.state).toEqual('state_1');
    expect(tester.getState().firstSub.state).toEqual('state_1');
    expect(tester.getState().secondSub.state).toEqual('state_1');

    tester.dispatch({ type: 'change_state' });

    expect(tester.getState().parent.state).toEqual('state_2');
    expect(tester.getState().firstSub.state).toEqual('state_1');
    expect(tester.getState().secondSub.state).toEqual(null);

    tester.dispatch({ type: 'change_state' });

    expect(tester.getState().parent.state).toEqual('state_3');
    expect(tester.getState().firstSub.state).toEqual(null);
    expect(tester.getState().secondSub.state).toEqual(null);
  });
});

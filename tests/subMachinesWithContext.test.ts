/* eslint-disable max-classes-per-file */
import { bindStm, StateMachine, stateMachineStarterSaga } from '../src';
import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { startStmActionType, stopStmActionType } from '../src/constants';

const buildContextSpy = jest.fn();

class FirstSubMachine extends StateMachine {
  readonly name = 'sub_1';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {},
  };
}

const firstSubMachine = new FirstSubMachine();

interface SubMachineContext {
  counter: number;
}

class SecondSubMachine extends StateMachine<
  string,
  string,
  string,
  SubMachineContext
> {
  readonly name = 'sub_2';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {},
  };
}

const secondSubMachine = new SecondSubMachine();

interface ParentContext {
  counter: number;
}

class ParentMachine extends StateMachine<
  string,
  string,
  string,
  ParentContext
> {
  readonly name = 'parent';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {
      subMachines: [
        firstSubMachine,
        bindStm(secondSubMachine, this.buildContext),
      ],
      transitions: {
        change_state: 'state_2',
      },
    },
    state_2: {
      subMachines: bindStm(secondSubMachine, this.buildContext),
      transitions: {
        change_state: 'state_3',
      },
    },
    state_3: {},
  };

  buildContext() {
    return buildContextSpy(this.context);
  }
}

const parentStateMachine = new ParentMachine();

describe('Sub state machines with context semantics', () => {
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

  test('sub state machines context can be built from parent context', () => {
    buildContextSpy.mockReturnValue({ counter: 5 });

    tester.dispatch(parentStateMachine.start({ counter: 1 }));

    expect(tester.getState().parent.state).toEqual('state_1');
    expect(tester.getState().parent.context).toEqual({ counter: 1 });
    expect(tester.getState().firstSub.state).toEqual('state_1');
    expect(tester.getState().secondSub.state).toEqual('state_1');
    expect(tester.getState().secondSub.context).toEqual({ counter: 5 });

    expect(buildContextSpy).toHaveBeenCalledTimes(1);
    expect(buildContextSpy).toHaveBeenCalledWith({ counter: 1 });

    jest.resetAllMocks();

    buildContextSpy.mockReturnValue({ counter: 3 });

    tester.dispatch({ type: 'change_state' });

    expect(tester.getState().parent.state).toEqual('state_2');
    expect(tester.getState().parent.context).toEqual({ counter: 1 });
    expect(tester.getState().firstSub.state).toEqual(null);
    expect(tester.getState().secondSub.state).toEqual('state_1');
    expect(tester.getState().secondSub.context).toEqual({ counter: 3 });

    expect(buildContextSpy).toHaveBeenCalledTimes(1);
    expect(buildContextSpy).toHaveBeenCalledWith({ counter: 1 });
  });
});

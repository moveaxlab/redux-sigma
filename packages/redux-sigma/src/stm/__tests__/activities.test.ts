import { combineReducers } from 'redux';
import SagaTester from 'redux-saga-tester';
import { StateMachine } from '../running';
import { stateMachineStarterSaga } from '../startup';
import {
  Events,
  firstEvent,
  secondEvent,
  simpleEvent,
  StateMachineNames,
  States,
} from './definitions.utils';

const someSaga = jest.fn();
const someOtherSaga = jest.fn();

const entrySaga = jest.fn();
const entrySaga2 = jest.fn();

const commandSaga = jest.fn();
const reactionSimpleSaga = jest.fn();
const reactionPayloadSaga = jest.fn();

const exitSaga = jest.fn();
const exitSaga2 = jest.fn();
const onExitSubSaga = jest.fn();
const commandSubStm = jest.fn();

class SubStm extends StateMachine<Events, States, StateMachineNames> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.firstSubStm;

  protected readonly spec = {
    [States.first]: {
      onExit: onExitSubSaga,
      transitions: {
        [Events.simple]: {
          target: States.third,
          command: commandSubStm,
        },
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

const subStm = new SubStm();

class BaseTestSTM extends StateMachine<Events, States, StateMachineNames> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {
      onEntry: entrySaga,
      onExit: [exitSaga, exitSaga2],
      subMachines: subStm,
      reactions: {
        [Events.simple]: reactionSimpleSaga,
        [Events.payload]: reactionPayloadSaga,
      },
      transitions: {
        [Events.second]: {
          target: States.second,
          command: commandSaga,
        },
      },
    },
    [States.second]: {
      onEntry: [entrySaga, entrySaga2],
      onExit: exitSaga,
      reactions: {
        [Events.simple]: reactionSimpleSaga,
        [Events.payload]: reactionPayloadSaga,
      },
      transitions: {
        [Events.first]: {
          target: States.first,
          command: commandSaga,
        },
      },
    },
    [States.third]: {},
  };
}

class MultipleCommandsSTM extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {
      onEntry: [entrySaga, entrySaga],
      onExit: [exitSaga, exitSaga2],
      subMachines: subStm,
      reactions: {
        [Events.simple]: reactionSimpleSaga,
        [Events.payload]: reactionPayloadSaga,
      },
      transitions: {
        [Events.second]: {
          target: States.second,
          command: [commandSaga, commandSaga],
        },
      },
    },
    [States.second]: {
      onEntry: [entrySaga, entrySaga2],
      onExit: exitSaga,
      reactions: {
        [Events.simple]: reactionSimpleSaga,
        [Events.payload]: reactionPayloadSaga,
      },
      transitions: {
        [Events.first]: {
          target: States.first,
          command: [commandSaga, commandSaga],
        },
      },
    },
    [States.third]: {},
  };
}

const baseStm = new BaseTestSTM();
const multipleCommandsSTM = new MultipleCommandsSTM();
//TESTS

beforeEach(() => {
  jest.resetAllMocks();
});

describe('Test running a STM', () => {
  it('starts an STM with multiple commands on Events', () => {
    const reducers = combineReducers({
      [MultipleCommandsSTM.name]: multipleCommandsSTM.stateReducer,
    });
    const sagaTester = new SagaTester<ReturnType<typeof reducers>>({
      reducers,
    });
    sagaTester.start(stateMachineStarterSaga, multipleCommandsSTM, subStm);
    sagaTester.dispatch(multipleCommandsSTM.start({}));

    expect(entrySaga).toHaveBeenCalledTimes(2);

    [
      entrySaga2,
      someSaga,
      someOtherSaga,
      reactionPayloadSaga,
      reactionSimpleSaga,
      commandSaga,
      exitSaga,
      exitSaga2,
    ].map(saga => {
      expect(saga).not.toHaveBeenCalled();
    });

    expect(sagaTester.getCalledActions()).toEqual([
      multipleCommandsSTM.start({}),
      subStm.start({}),
    ]);

    expect(sagaTester.getState()[MultipleCommandsSTM.name].state).toEqual(
      States.first
    );

    jest.resetAllMocks();

    sagaTester.dispatch(secondEvent());

    expect(sagaTester.getState()[MultipleCommandsSTM.name].state).toEqual(
      States.second
    );

    expect(exitSaga).toHaveBeenCalledTimes(1);
    expect(exitSaga2).toHaveBeenCalledTimes(1);

    expect(commandSaga).toHaveBeenCalledTimes(2);

    expect(entrySaga).toHaveBeenCalledTimes(1);
    expect(entrySaga2).toHaveBeenCalledTimes(1);

    [someSaga, someOtherSaga, reactionPayloadSaga, reactionSimpleSaga].map(
      saga => {
        expect(saga).not.toHaveBeenCalled();
      }
    );

    jest.resetAllMocks();

    sagaTester.dispatch(firstEvent());

    expect(sagaTester.getState()[MultipleCommandsSTM.name].state).toEqual(
      States.first
    );

    expect(exitSaga).toHaveBeenCalledTimes(1);

    expect(commandSaga).toHaveBeenCalledTimes(2);

    expect(entrySaga).toHaveBeenCalledTimes(2);

    [
      entrySaga2,
      exitSaga2,
      someSaga,
      someOtherSaga,
      reactionPayloadSaga,
      reactionSimpleSaga,
    ].map(saga => {
      expect(saga).not.toHaveBeenCalled();
    });

    sagaTester.dispatch(multipleCommandsSTM.stop());
  });

  it('starts STM only once on multiple start action dispatch', () => {
    const reducers = combineReducers({
      [baseStm.name]: baseStm.stateReducer,
    });
    const sagaTester = new SagaTester<ReturnType<typeof reducers>>({
      reducers,
    });
    sagaTester.start(stateMachineStarterSaga, baseStm, subStm);
    // dispatch action twice
    sagaTester.dispatch(baseStm.start({}));
    sagaTester.dispatch(baseStm.start({}));
    expect(sagaTester.getCalledActions()).toEqual([
      baseStm.start({}),
      subStm.start({}),
      baseStm.start({}),
    ]);
    // entry saga called only once
    expect(entrySaga).toHaveBeenCalledTimes(1);

    sagaTester.dispatch(baseStm.stop());
  });

  it('STM ENTRY', () => {
    const reducers = combineReducers({
      [baseStm.name]: baseStm.stateReducer,
    });
    const sagaTester = new SagaTester<ReturnType<typeof reducers>>({
      reducers,
    });
    sagaTester.start(stateMachineStarterSaga, baseStm, subStm);
    sagaTester.dispatch(baseStm.start({}));

    expect(entrySaga).toHaveBeenCalledTimes(1);

    [
      entrySaga2,
      someSaga,
      someOtherSaga,
      reactionPayloadSaga,
      reactionSimpleSaga,
      commandSaga,
      exitSaga,
      exitSaga2,
    ].map(saga => {
      expect(saga).not.toHaveBeenCalled();
    });

    expect(sagaTester.getCalledActions()).toEqual([
      baseStm.start({}),
      subStm.start({}),
    ]);

    expect(sagaTester.getState()[baseStm.name].state).toEqual(States.first);

    jest.resetAllMocks();

    sagaTester.dispatch(secondEvent());

    expect(sagaTester.getState()[baseStm.name].state).toEqual(States.second);

    expect(exitSaga).toHaveBeenCalledTimes(1);
    expect(exitSaga2).toHaveBeenCalledTimes(1);

    expect(commandSaga).toHaveBeenCalledTimes(1);

    expect(entrySaga).toHaveBeenCalledTimes(1);
    expect(entrySaga2).toHaveBeenCalledTimes(1);

    [someSaga, someOtherSaga, reactionPayloadSaga, reactionSimpleSaga].map(
      saga => {
        expect(saga).not.toHaveBeenCalled();
      }
    );

    jest.resetAllMocks();

    sagaTester.dispatch(firstEvent());

    expect(sagaTester.getState()[baseStm.name].state).toEqual(States.first);

    expect(exitSaga).toHaveBeenCalledTimes(1);

    expect(commandSaga).toHaveBeenCalledTimes(1);

    expect(entrySaga).toHaveBeenCalledTimes(1);

    [
      entrySaga2,
      exitSaga2,
      someSaga,
      someOtherSaga,
      reactionPayloadSaga,
      reactionSimpleSaga,
    ].map(saga => {
      expect(saga).not.toHaveBeenCalled();
    });

    sagaTester.dispatch(baseStm.stop());
  });

  describe('test reactions', () => {
    it('STM SIMPLE REACTION', () => {
      jest.resetAllMocks();

      const reducers = combineReducers({
        [baseStm.name]: baseStm.stateReducer,
      });
      const sagaTester = new SagaTester<ReturnType<typeof reducers>>({
        reducers,
      });
      sagaTester.start(stateMachineStarterSaga, baseStm, subStm);
      sagaTester.dispatch(baseStm.start({}));

      expect(entrySaga).toHaveBeenCalledTimes(1);

      sagaTester.dispatch(simpleEvent());

      [
        someSaga,
        someOtherSaga,
        reactionPayloadSaga,
        commandSaga,
        exitSaga,
        exitSaga2,
      ].map(saga => {
        expect(saga).not.toHaveBeenCalled();
      });

      expect(reactionSimpleSaga).toHaveBeenCalledTimes(1);
      //expect(sagaTester.getCalledActions()).toEqual([startBaseSTMEvent]);
      //At the end of the test first state machine should be in transitioned to state second
      expect(sagaTester.getState()[baseStm.name].state).toEqual(States.first);

      sagaTester.dispatch(baseStm.stop());
    });
  });

  describe('test transitions', () => {
    it('STM EXITS', () => {
      const reducers = combineReducers({
        [baseStm.name]: baseStm.stateReducer,
      });
      const sagaTester = new SagaTester<ReturnType<typeof reducers>>({
        reducers,
      });
      sagaTester.start(stateMachineStarterSaga, baseStm, subStm);
      sagaTester.dispatch(baseStm.start({}));

      expect(entrySaga).toHaveBeenCalledTimes(1);

      sagaTester.dispatch(secondEvent());

      expect(someSaga).not.toHaveBeenCalled();
      expect(someOtherSaga).not.toHaveBeenCalled();
      expect(reactionPayloadSaga).not.toHaveBeenCalled();
      expect(reactionSimpleSaga).not.toHaveBeenCalled();

      expect(commandSaga).toHaveBeenCalledTimes(1);

      expect(exitSaga).toHaveBeenCalledTimes(1);
      expect(exitSaga2).toHaveBeenCalledTimes(1);

      expect(entrySaga).toHaveBeenCalledTimes(2);

      //At the end of the test first state machine should be in transitioned to state second
      expect(sagaTester.getState()[baseStm.name].state).toEqual(States.second);

      sagaTester.dispatch(baseStm.stop());
    });
  });
});

describe('Test on exit on stop stm', () => {
  it('should execute all on exit on terminate stm', function() {
    const baseStm = new BaseTestSTM();
    const subStm = new SubStm();

    const reducers = combineReducers({
      [baseStm.name]: baseStm.stateReducer,
      [subStm.name]: subStm.stateReducer,
    });

    const tester = new SagaTester<ReturnType<typeof reducers>>({
      reducers,
    });

    tester.start(stateMachineStarterSaga, baseStm, subStm);
    tester.dispatch(baseStm.start({}));

    expect(onExitSubSaga).not.toHaveBeenCalled();
    expect(exitSaga).not.toHaveBeenCalled();
    expect(exitSaga2).not.toHaveBeenCalled();

    tester.dispatch(secondEvent());

    expect(onExitSubSaga).toHaveBeenCalledTimes(1);
    expect(exitSaga).toHaveBeenCalledTimes(1);
    expect(exitSaga2).toHaveBeenCalledTimes(1);
    expect(tester.getState()[subStm.name].state).toBeNull();

    tester.dispatch(baseStm.stop());

    expect(exitSaga).toHaveBeenCalledTimes(2);
  });

  test('should call on exit one time if command fail', async done => {
    const baseStm = new BaseTestSTM();
    const subStm = new SubStm();

    const reducers = combineReducers({
      [baseStm.name]: baseStm.stateReducer,
      [subStm.name]: subStm.stateReducer,
    });

    const tester = new SagaTester<ReturnType<typeof reducers>>({
      reducers,
      options: {
        onError: () => {},
      },
    });

    tester.start(stateMachineStarterSaga, baseStm, subStm);
    tester.dispatch(baseStm.start({}));

    expect(onExitSubSaga).not.toHaveBeenCalled();
    expect(exitSaga).not.toHaveBeenCalled();
    expect(exitSaga2).not.toHaveBeenCalled();

    commandSubStm.mockRejectedValue(new Error('Errore tremmendo'));

    try {
      tester.dispatch(simpleEvent());

      await tester.waitFor(Events.first);
    } catch (e) {
      expect(onExitSubSaga).toHaveBeenCalledTimes(1);

      tester.dispatch(baseStm.stop());

      done();
    }
  });
});
test.todo('tests that activities are passed the context');

test.todo('tests that activities are called in the correct order');

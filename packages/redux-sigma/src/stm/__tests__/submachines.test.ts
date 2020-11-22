/* eslint-disable max-classes-per-file */
import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { stopStmActionType } from '../../constants';
import { StateMachine } from '../StateMachine';
import { stateMachineStarterSaga } from '../startup';
import { Events, StateMachineNames, States } from './definitions.utils';

/**
 * Sub machines
 */

class FirstSubSTM extends StateMachine<Events, States, StateMachineNames> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.firstSubStm;

  protected readonly spec = {
    [States.first]: {},
    [States.second]: {},
    [States.third]: {},
  };
}

const firstSubStm = new FirstSubSTM();

class SecondSubSTM extends StateMachine<Events, States, StateMachineNames> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.secondSubStm;

  protected readonly spec = {
    [States.first]: {},
    [States.second]: {},
    [States.third]: {},
  };
}

const secondSubStm = new SecondSubSTM();

class NestedSubMachineSTM extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.nestedStm;

  protected readonly spec = {
    [States.first]: {
      subMachines: secondSubStm,
      transitions: {
        [Events.first]: States.second,
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

const nestedSubMachineStm = new NestedSubMachineSTM();

/**
 * Top level machines
 */

class SingleSubMachineSTM extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {
      subMachines: firstSubStm,
      transitions: {
        [Events.first]: States.second,
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

const singleSubMachineStm = new SingleSubMachineSTM();

class MultipleSubMachineSTM extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {
      subMachines: [firstSubStm, secondSubStm],
      transitions: {
        [Events.first]: States.second,
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

const multipleSubMachineStm = new MultipleSubMachineSTM();

class TopLevelNestedSubMachineSTM extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {
      subMachines: [nestedSubMachineStm],
      transitions: {
        [Events.first]: States.second,
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

const topLevelNestedSubMachineStm = new TopLevelNestedSubMachineSTM();

describe('Test sub STM behaviour', () => {
  it('tests single sub STM starting and stopping', async () => {
    const mainStm = singleSubMachineStm;
    const subStm = firstSubStm;

    const reducer = combineReducers({
      [mainStm.name]: mainStm.stateReducer,
      [subStm.name]: subStm.stateReducer,
    });

    const tester = new SagaTester({
      reducers: reducer,
    });

    tester.start(stateMachineStarterSaga, mainStm, subStm);

    expect(tester.getState()[mainStm.name].state).toBeNull();
    expect(tester.getState()[subStm.name].state).toBeNull();

    tester.dispatch(mainStm.start({}));

    expect(tester.getState()[mainStm.name].state).toEqual(States.first);
    expect(tester.getState()[subStm.name].state).toEqual(States.first);

    tester.dispatch({ type: Events.first });

    await tester.waitFor(stopStmActionType);

    expect(tester.getState()[mainStm.name].state).toEqual(States.second);
    expect(tester.getState()[subStm.name].state).toBeNull();

    tester.dispatch(mainStm.stop());
  });

  it('test multiple sub STM starting and stopping', async () => {
    const mainStm = multipleSubMachineStm;

    expect(mainStm.name).not.toEqual(firstSubStm.name);
    expect(mainStm.name).not.toEqual(secondSubStm.name);
    expect(firstSubStm.name).not.toEqual(secondSubStm.name);

    const reducer = combineReducers({
      [mainStm.name]: mainStm.stateReducer,
      [firstSubStm.name]: firstSubStm.stateReducer,
      [secondSubStm.name]: secondSubStm.stateReducer,
    });

    const tester = new SagaTester({
      reducers: reducer,
    });

    tester.start(stateMachineStarterSaga, mainStm, firstSubStm, secondSubStm);

    expect(tester.getState()[mainStm.name].state).toBeNull();
    expect(tester.getState()[firstSubStm.name].state).toBeNull();
    expect(tester.getState()[secondSubStm.name].state).toBeNull();

    tester.dispatch(mainStm.start({}));

    expect(tester.getState()[mainStm.name].state).toEqual(States.first);
    expect(tester.getState()[firstSubStm.name].state).toEqual(States.first);
    expect(tester.getState()[secondSubStm.name].state).toEqual(States.first);

    tester.dispatch({ type: Events.first });

    expect(tester.getState()[mainStm.name].state).toEqual(States.second);
    expect(tester.getState()[firstSubStm.name].state).toBeNull();
    expect(tester.getState()[secondSubStm.name].state).toBeNull();

    tester.dispatch(mainStm.stop());
  });

  it('tests starting and stopping nested sub STMs', () => {
    const mainStm = topLevelNestedSubMachineStm;
    const firstSubStm = nestedSubMachineStm;

    expect(mainStm.name).not.toEqual(firstSubStm.name);
    expect(mainStm.name).not.toEqual(secondSubStm.name);
    expect(firstSubStm.name).not.toEqual(secondSubStm.name);

    const reducer = combineReducers({
      [mainStm.name]: mainStm.stateReducer,
      [firstSubStm.name]: firstSubStm.stateReducer,
      [secondSubStm.name]: secondSubStm.stateReducer,
    });

    const tester = new SagaTester({
      reducers: reducer,
    });

    tester.start(stateMachineStarterSaga, mainStm, firstSubStm, secondSubStm);

    expect(tester.getState()[mainStm.name].state).toBeNull();
    expect(tester.getState()[firstSubStm.name].state).toBeNull();
    expect(tester.getState()[secondSubStm.name].state).toBeNull();

    tester.dispatch(mainStm.start({}));

    expect(tester.getState()[mainStm.name].state).toEqual(States.first);
    expect(tester.getState()[firstSubStm.name].state).toEqual(States.first);
    expect(tester.getState()[secondSubStm.name].state).toEqual(States.first);

    tester.dispatch({ type: Events.first });

    expect(tester.getState()[mainStm.name].state).toEqual(States.second);
    expect(tester.getState()[firstSubStm.name].state).toBeNull();
    expect(tester.getState()[secondSubStm.name].state).toBeNull();

    tester.dispatch(mainStm.stop());
  });
});

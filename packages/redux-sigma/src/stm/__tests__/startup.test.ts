import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { StateMachine } from '../StateMachine';
import { DuplicateStateMachineError } from '../startup/starter';
import { Events, StateMachineNames, States } from './definitions.utils';
import { stateMachineStarterSaga } from '../startup';
import { startStmActionType, stopStmActionType } from '../../constants';

class StartupTestStateMachine extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {},
    [States.second]: {},
    [States.third]: {},
  };
}

test.todo('tests that startup saga boots all STM sagas');

test.todo('tests that STM starter saga stops saga correctly');

test('tests that starting/stopping an unknown STM does not break stuff', async () => {
  const stm = new StartupTestStateMachine();

  const reducer = combineReducers({
    [stm.name]: stm.stateReducer,
  });

  const tester = new SagaTester({
    reducers: reducer,
  });

  tester.start(stateMachineStarterSaga, stm);

  tester.dispatch({
    type: startStmActionType,
    payload: { name: 'unknown_stm' },
  });

  expect(tester.getState()[stm.name].state).toBeNull();

  tester.dispatch(stm.start({}));

  expect(tester.getState()[stm.name].state).toEqual(States.first);

  tester.dispatch({
    type: stopStmActionType,
    payload: { name: 'unknown_stm' },
  });

  expect(tester.getState()[stm.name].state).toEqual(States.first);

  tester.dispatch(stm.stop());

  expect(tester.getState()[stm.name].state).toBeNull();
});

test('test that starting a saga twice throws an error', async () => {
  const stm = new StartupTestStateMachine();
  const reducer = combineReducers({
    [stm.name]: stm.stateReducer,
  });

  const tester = new SagaTester({
    reducers: reducer,
  });

  const task = tester.start(stateMachineStarterSaga, stm, stm);

  expect(task.error()).toBeInstanceOf(DuplicateStateMachineError);
});

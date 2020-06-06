import { combineReducers } from 'redux';
import SagaTester from 'redux-saga-tester';
import { StateMachine } from '../running';
import { Events, StateMachineNames, States } from './definitions.utils';

interface Context {
  var?: boolean;
}

class StorageStateMachine extends StateMachine<
  Events,
  States,
  StateMachineNames,
  Context
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {},
    [States.second]: {},
    [States.third]: {},
  };
}

test('tests that storage works correctly', async () => {
  const stm = new StorageStateMachine();

  const reducer = combineReducers({
    [stm.name]: stm.stateReducer,
  });

  const tester = new SagaTester<ReturnType<typeof reducer>>({
    reducers: reducer,
  });

  // state is initially null
  expect(tester.getState()[stm.name].state).toBeNull();
  expect(tester.getState()[stm.name].context).toBeUndefined();

  // starting a STM takes it to its initial state
  tester.dispatch(stm.start({}));
  expect(tester.getState()[stm.name].state).toEqual(States.first);
  expect(tester.getState()[stm.name].context).toEqual({});

  // starting it twice changes nothing
  tester.dispatch(stm.start({}));
  expect(tester.getState()[stm.name].state).toEqual(States.first);
  expect(tester.getState()[stm.name].context).toEqual({});

  // state is stored correctly
  tester.dispatch(stm['storeState'](States.second));
  expect(tester.getState()[stm.name].state).toEqual(States.second);
  expect(tester.getState()[stm.name].context).toEqual({});

  tester.dispatch(stm['storeState'](States.third));
  expect(tester.getState()[stm.name].state).toEqual(States.third);
  expect(tester.getState()[stm.name].context).toEqual({});

  // context is stored correctly
  tester.dispatch(stm['storeContext']({ var: true }));
  expect(tester.getState()[stm.name].state).toEqual(States.third);
  expect(tester.getState()[stm.name].context).toEqual({ var: true });

  // after stopping an STM, the state is null
  tester.dispatch(stm.stop());
  expect(tester.getState()[stm.name].state).toBeNull();
  expect(tester.getState()[stm.name].context).toBeUndefined();

  // storing state while the STM is stopped does nothing
  tester.dispatch(stm['storeState'](States.third));
  expect(tester.getState()[stm.name].state).toBeNull();
  expect(tester.getState()[stm.name].context).toBeUndefined();

  // storing context while the STM is stopped does nothing
  tester.dispatch(stm['storeContext']({ var: true }));
  expect(tester.getState()[stm.name].state).toBeNull();
  expect(tester.getState()[stm.name].context).toBeUndefined();

  // starting an STM again takes it to the initial state
  tester.dispatch(stm.start({}));
  expect(tester.getState()[stm.name].state).toEqual(States.first);
  expect(tester.getState()[stm.name].context).toEqual({});
});

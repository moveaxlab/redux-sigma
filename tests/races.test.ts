import { StateMachine, stateMachineStarterSaga } from '../src';
import { put } from 'redux-saga/effects';
import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';

class RacingStateMachine extends StateMachine {
  readonly name = 'racing';

  protected readonly initialState = 'state_1';

  protected readonly spec = {
    state_1: {
      onEntry: this.onEntry,
      transitions: {
        change_state: 'state_2',
      },
    },
    state_2: {},
  };

  *onEntry() {
    yield put({ type: 'change_state' });
  }
}

const stateMachine = new RacingStateMachine();

describe('onEntry and transitions race conditions', () => {
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

  test('events emitted by onEntry that trigger transitions are detected', async () => {
    tester.dispatch(stateMachine.start({}));

    await tester.waitFor('change_state');

    expect(tester.getState().stateMachine.state).toEqual('state_2');
  });
});

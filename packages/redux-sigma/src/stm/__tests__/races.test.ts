import { combineReducers } from 'redux';
import SagaTester from 'redux-saga-tester';
import { StateMachine } from '../running';
import { stateMachineStarterSaga } from '../startup';
import { Events, StateMachineNames, States } from './definitions.utils';
import { put } from 'redux-saga/effects';

class RacingStateMachine extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {
      onEntry: [this.emitTransitionEvent, this.doHeavyWork],
      transitions: {
        [Events.first]: {
          target: States.second,
          command: this.emitMissedEvent,
        },
      },
    },
    [States.second]: {
      transitions: {
        [Events.second]: States.third,
      },
    },
    [States.third]: {},
  };

  *emitMissedEvent() {
    yield put({ type: Events.second });
  }

  *emitTransitionEvent() {
    yield put({ type: Events.first });
  }

  *doHeavyWork() {
    let i = 0;
    while (i < 1000000) {
      i++;
    }
    yield put({ type: 'heavy work done' });
  }
}

test('test activity that triggers a transition when entering a state', async () => {
  const stm = new RacingStateMachine();

  const reducer = combineReducers({
    [stm.name]: stm.stateReducer,
  });

  const tester = new SagaTester<ReturnType<typeof reducer>>({
    reducers: reducer,
  });

  tester.start(stateMachineStarterSaga, stm);

  tester.dispatch(stm.start({}));

  await tester.waitFor(Events.first);

  expect(tester.getState()[stm.name].state).toEqual(States.second);
});

test('test activity that takes an event emitted before entering a state', async () => {
  const stm = new RacingStateMachine();

  const reducer = combineReducers({
    [stm.name]: stm.stateReducer,
  });

  const tester = new SagaTester<ReturnType<typeof reducer>>({
    reducers: reducer,
  });

  tester.start(stateMachineStarterSaga, stm);

  tester.dispatch(stm.start({}));

  await tester.waitFor(Events.first);

  expect(tester.getState()[stm.name].state).toEqual(States.second);

  await tester.waitFor(Events.second);

  expect(tester.getState()[stm.name].state).not.toEqual(States.third);
});

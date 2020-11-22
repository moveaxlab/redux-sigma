import {
  all,
  first,
  last,
  StateMachine,
  stateMachineStarterSaga,
} from '../src';
import { call, put, cancelled } from 'redux-saga/effects';
import { delay } from 'redux-saga/effects';
import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import waitForExpect from 'wait-for-expect';

const spy = jest.fn();

const startSpy = jest.fn();
const endSpy = jest.fn();
const cancelledSpy = jest.fn();

enum Events {
  changeState = 'change_state',
  slowReaction = 'slow_reaction',
  defaultReaction = 'default_reaction',
  reactionPolicyAll = 'reaction_policy_all',
  reactionPolicyFirst = 'reaction_policy_first',
  reactionPolicyLast = 'reaction_policy_last',
}

interface ReactionEvent<E extends Events = Events> {
  type: E;
  payload: {
    counter: number;
  };
}

class StateMachineWithReactions extends StateMachine<Events> {
  protected readonly initialState = 'state_1';

  readonly name = 'reactions';

  protected readonly spec = {
    state_1: {
      reactions: {
        [Events.slowReaction]: this.slowReaction,
        [Events.defaultReaction]: this.reaction,
        [Events.reactionPolicyAll]: all(this.reaction),
        [Events.reactionPolicyFirst]: first(this.reaction),
        [Events.reactionPolicyLast]: last(this.reaction),
      },
      transitions: {
        [Events.changeState]: 'state_2',
      },
    },
    state_2: {},
  };

  *slowReaction() {
    try {
      yield put({ type: 'reaction_start' });
      yield call(startSpy);
      yield delay(100);
      yield call(endSpy);
    } finally {
      if (yield cancelled()) {
        yield call(cancelledSpy);
      }
    }
  }

  *reaction(event: ReactionEvent) {
    yield delay(10);
    yield call(spy, event.payload.counter);
    yield put({ type: 'reaction_done' });
  }
}

const stateMachine = new StateMachineWithReactions();

describe('Reactions semantics', () => {
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

  test('reactions are stopped by transitions', () => {
    tester.dispatch(stateMachine.start({}));

    tester.dispatch({ type: Events.slowReaction });

    tester.dispatch({ type: Events.changeState });

    expect(tester.getState().stateMachine.state).toEqual('state_2');

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(endSpy).not.toHaveBeenCalled();
    expect(cancelledSpy).toHaveBeenCalledTimes(1);
    expect(startSpy).toHaveBeenCalledBefore(cancelledSpy);
  });

  test('reactions are stopped when the state machine is stopped', () => {
    tester.dispatch(stateMachine.start({}));

    tester.dispatch({ type: Events.slowReaction });

    tester.dispatch(stateMachine.stop());

    expect(tester.getState().stateMachine.state).toEqual(null);

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(endSpy).not.toHaveBeenCalled();
    expect(cancelledSpy).toHaveBeenCalledTimes(1);
    expect(startSpy).toHaveBeenCalledBefore(cancelledSpy);
  });

  test('default reaction policy processes every event', async () => {
    tester.dispatch(stateMachine.start({}));

    for (let i = 0; i < 10; i++) {
      tester.dispatch({
        type: Events.defaultReaction,
        payload: { counter: i },
      });
    }

    await waitForExpect(() => {
      expect(tester.numCalled('reaction_done')).toEqual(10);
    });

    expect(spy).toHaveBeenCalledTimes(10);

    for (let i = 0; i < 10; i++) {
      expect(spy).toHaveBeenNthCalledWith(i + 1, i);
    }
  });

  test('`all` reaction policy processes every event', async () => {
    tester.dispatch(stateMachine.start({}));

    for (let i = 0; i < 10; i++) {
      tester.dispatch({
        type: Events.reactionPolicyAll,
        payload: { counter: i },
      });
    }

    await waitForExpect(() => {
      expect(tester.numCalled('reaction_done')).toEqual(10);
    });

    expect(spy).toHaveBeenCalledTimes(10);

    for (let i = 0; i < 10; i++) {
      expect(spy).toHaveBeenNthCalledWith(i + 1, i);
    }
  });

  test('`first` reaction policy processes only the first event', async () => {
    tester.dispatch(stateMachine.start({}));

    for (let i = 0; i < 10; i++) {
      tester.dispatch({
        type: Events.reactionPolicyFirst,
        payload: { counter: i },
      });
    }

    await waitForExpect(() => {
      expect(tester.numCalled('reaction_done')).toEqual(1);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenNthCalledWith(1, 0);
  });

  test('`last` reaction policy processes only the last event', async () => {
    tester.dispatch(stateMachine.start({}));

    for (let i = 0; i < 10; i++) {
      tester.dispatch({
        type: Events.reactionPolicyLast,
        payload: { counter: i },
      });
    }

    await waitForExpect(() => {
      expect(tester.numCalled('reaction_done')).toEqual(1);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenNthCalledWith(1, 9);
  });
});

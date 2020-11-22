import { StateMachine, stateMachineStarterSaga } from '../src';
import { combineReducers } from 'redux';
import { SagaTester } from '@moveaxlab/redux-saga-tester';
import { put } from 'redux-saga/effects';

const guardSpy = jest.fn();

interface Context {
  counter: number;
  message?: string;
}

enum Events {
  updateContext = 'updateContext',
  overwriteContext = 'overwriteContext',
  emitContext = 'emitContext',
  guardTransition = 'guardTransition',
}

interface UpdateContextEvent {
  type: Events.updateContext;
  payload: {
    increase_counter: number;
  };
}

interface OverwriteContextEvent {
  type: Events.overwriteContext;
  payload: {
    new_counter: number;
    new_message?: string;
  };
}

class StateMachineWithContext extends StateMachine<
  Events,
  string,
  string,
  Context
> {
  protected readonly initialState = 'state_1';

  readonly name = 'on_exit';

  protected readonly spec = {
    state_1: {
      reactions: {
        [Events.updateContext]: this.updateContext,
        [Events.overwriteContext]: this.overwriteContext,
        [Events.emitContext]: this.emitContext,
      },
      transitions: {
        [Events.guardTransition]: {
          guard: guardSpy,
          target: 'state_1',
        },
      },
    },
  };

  *updateContext(event: UpdateContextEvent) {
    yield* this.setContext(ctx => {
      ctx.counter += event.payload.increase_counter;
      ctx.message = 'Context updated';
    });
    yield put({ type: 'context_updated' });
  }

  *overwriteContext(event: OverwriteContextEvent) {
    yield* this.setContext({
      counter: event.payload.new_counter,
      message: event.payload.new_message,
    });
    yield put({ type: 'context_updated' });
  }

  *emitContext() {
    yield put({ type: 'context_value', payload: this.context });
  }
}

const stateMachine = new StateMachineWithContext();

describe('Context semantics', () => {
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

  test('context is initialized correctly', () => {
    tester.dispatch(stateMachine.start({ counter: 1 }));

    expect(tester.getState().stateMachine.context).toEqual({ counter: 1 });
  });

  test('context is discarded when the state machine is stopped', () => {
    tester.dispatch(stateMachine.start({ counter: 2, message: 'message' }));

    expect(tester.getState().stateMachine.context).toEqual({
      counter: 2,
      message: 'message',
    });

    tester.dispatch(stateMachine.stop());

    expect(tester.getState().stateMachine.context).toBeUndefined();

    tester.dispatch(stateMachine.start({ counter: 1 }));

    expect(tester.getState().stateMachine.context).toEqual({
      counter: 1,
    });
  });

  test('context can be updated with functions', () => {
    tester.dispatch(stateMachine.start({ counter: 0 }));

    const event: UpdateContextEvent = {
      type: Events.updateContext,
      payload: {
        increase_counter: 5,
      },
    };

    tester.dispatch(event);

    expect(tester.getState().stateMachine.context).toEqual({
      counter: 5,
      message: 'Context updated',
    });

    tester.dispatch(event);

    expect(tester.getState().stateMachine.context).toEqual({
      counter: 10,
      message: 'Context updated',
    });
  });

  test('context can be overwritten', () => {
    tester.dispatch(stateMachine.start({ counter: 0 }));

    let event: OverwriteContextEvent = {
      type: Events.overwriteContext,
      payload: {
        new_counter: 3,
        new_message: 'message 1',
      },
    };

    tester.dispatch(event);

    expect(tester.getState().stateMachine.context).toEqual({
      counter: 3,
      message: 'message 1',
    });

    event = {
      type: Events.overwriteContext,
      payload: {
        new_counter: 6,
        new_message: 'message 2',
      },
    };

    tester.dispatch(event);

    expect(tester.getState().stateMachine.context).toEqual({
      counter: 6,
      message: 'message 2',
    });
  });

  test('context can be read by activities', async () => {
    tester.dispatch(stateMachine.start({ counter: 0 }));

    let eventFuture = tester.waitFor('context_value', true);

    tester.dispatch({ type: Events.emitContext });

    await expect(eventFuture).resolves.toEqual({
      type: 'context_value',
      payload: {
        counter: 0,
      },
    });

    const updateEvent: OverwriteContextEvent = {
      type: Events.overwriteContext,
      payload: {
        new_counter: 3,
        new_message: 'message 1',
      },
    };

    tester.dispatch(updateEvent);

    eventFuture = tester.waitFor('context_value', true);

    tester.dispatch({ type: Events.emitContext });

    await expect(eventFuture).resolves.toEqual({
      type: 'context_value',
      payload: {
        counter: 3,
        message: 'message 1',
      },
    });
  });

  test('guards are passed the current value of the context', () => {
    guardSpy.mockReturnValue(false);

    tester.dispatch(stateMachine.start({ counter: 0 }));

    const event = { type: Events.guardTransition };

    tester.dispatch(event);

    expect(guardSpy).toHaveBeenLastCalledWith(event, { counter: 0 });

    const updateEvent: OverwriteContextEvent = {
      type: Events.overwriteContext,
      payload: {
        new_counter: 3,
        new_message: 'message 1',
      },
    };

    tester.dispatch(updateEvent);

    tester.dispatch(event);

    expect(guardSpy).toHaveBeenLastCalledWith(event, {
      counter: 3,
      message: 'message 1',
    });
  });
});

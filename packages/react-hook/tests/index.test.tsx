/* eslint-disable max-classes-per-file react/no-multi-comp */

import React, { FC } from 'react';
import { useStateMachine } from '../src';
import { cleanup, render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { StateMachine } from 'redux-sigma';
import { put } from 'redux-saga/effects';
import { Action } from 'redux';

enum States {
  state1 = 'state1',
  state2 = 'state2',
}

enum Events {
  event1 = 'event1',
}

enum Names {
  name1 = 'name1',
  name2 = 'name2',
}

interface Context {
  param: string;
}

interface Event1 extends Action<Events.event1> {
  payload: string;
}

class StateMachineWithoutContext extends StateMachine<Events, States, Names> {
  protected readonly initialState = States.state1;

  readonly name = Names.name1;

  protected readonly spec = {
    [States.state1]: {
      transitions: {
        [Events.event1]: {
          target: States.state1,
          command: this.storeSomething,
        },
      },
    },
    [States.state2]: {
      transitions: {
        [Events.event1]: {
          target: States.state1,
          command: this.storeSomething,
        },
      },
    },
  };

  *storeSomething(event: Event1) {
    yield put({ type: 'something happened', payload: event.payload });
  }
}

const stmWithoutContext = new StateMachineWithoutContext();

class StateMachineWithContext extends StateMachine<
  Events,
  States,
  Names,
  Context
> {
  protected readonly initialState = States.state1;

  readonly name = Names.name2;

  protected readonly spec = {
    [States.state1]: {
      transitions: {
        [Events.event1]: {
          target: States.state1,
          command: this.storeSomething,
        },
      },
    },
    [States.state2]: {
      transitions: {
        [Events.event1]: {
          target: States.state1,
          command: this.storeSomething,
        },
      },
    },
  };

  *storeSomething(event: Event1) {
    yield put({ type: 'something happened', payload: event.payload });
  }
}

const stmWithContext = new StateMachineWithContext();

const ComponentWithSTM: FC = () => {
  useStateMachine(stmWithoutContext, {});

  return <div>I use a state machine</div>;
};

const ComponentWithSTMAndParam: FC<Context> = ({ param }) => {
  useStateMachine(stmWithContext, { param });

  return <div>I use a state machine</div>;
};

afterEach(cleanup);

it('tests the useStateMachine hook', () => {
  const mockStore = configureStore();
  const store = mockStore();

  const { unmount, rerender } = render(
    <Provider store={store}>
      <ComponentWithSTM />
    </Provider>
  );

  let actions = store.getActions();
  expect(actions).toEqual([stmWithoutContext.start({})]);
  store.clearActions();

  rerender(
    <Provider store={store}>
      <ComponentWithSTM />
    </Provider>
  );
  actions = store.getActions();
  expect(actions).toEqual([]);
  store.clearActions();

  unmount();

  actions = store.getActions();
  expect(actions).toEqual([stmWithoutContext.stop()]);
  store.clearActions();
});

it('tests the useStateMachine hook with context', () => {
  const mockStore = configureStore();
  const store = mockStore();

  const { unmount, rerender } = render(
    <Provider store={store}>
      <ComponentWithSTMAndParam param="abc" />
    </Provider>
  );

  let actions = store.getActions();
  expect(actions).toEqual([stmWithContext.start({ param: 'abc' })]);
  store.clearActions();

  rerender(
    <Provider store={store}>
      <ComponentWithSTMAndParam param="abc" />
    </Provider>
  );
  actions = store.getActions();
  expect(actions).toEqual([]);
  store.clearActions();

  rerender(
    <Provider store={store}>
      <ComponentWithSTMAndParam param="def" />
    </Provider>
  );
  actions = store.getActions();
  expect(actions).toEqual([
    stmWithContext.stop(),
    stmWithContext.start({ param: 'def' }),
  ]);
  store.clearActions();

  unmount();

  actions = store.getActions();
  expect(actions).toEqual([stmWithContext.stop()]);
  store.clearActions();
});

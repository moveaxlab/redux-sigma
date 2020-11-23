/* eslint-disable no-console */
import { StateMachine, stateMachineStarterSaga } from '../src';
import { Action, applyMiddleware, combineReducers, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import {
  delay,
  call,
  put,
  take,
  select,
  StrictEffect,
} from 'redux-saga/effects';
import { API } from './api';
import { storeStmStateActionType } from '../src/constants';
import { StmStorage } from '../src/types';

interface Context {
  input?: string;
  results?: string[];
}

enum Events {
  inputChanged = 'input_changed',
  noResults = 'no_results',
  resultsFound = 'results_found',
  searchFailed = 'search_failed',
}

enum States {
  noInput = 'no_input',
  searching = 'searching',
  noResults = 'no_results',
  resultsFound = 'results_found',
  searchFailed = 'search_failed',
}

enum StateMachineNames {
  search = 'search',
}

interface InputChangedEvent extends Action<Events.inputChanged> {
  payload: string;
}

class SearchStateMachine extends StateMachine<
  Events,
  States,
  StateMachineNames,
  Context
> {
  readonly name = StateMachineNames.search;

  protected readonly initialState = States.noInput;

  protected readonly spec = {
    [States.noInput]: {
      transitions: {
        [Events.inputChanged]: {
          guard: (event: InputChangedEvent) => event.payload.length > 0,
          command: this.storeInput,
          target: States.searching,
        },
      },
    },
    [States.searching]: {
      onEntry: this.search,
      transitions: {
        [Events.inputChanged]: [
          {
            guard: (event: InputChangedEvent) => event.payload.length == 0,
            command: this.storeInput,
            target: States.noInput,
          },
          {
            guard: (event: InputChangedEvent) => event.payload.length > 0,
            command: this.storeInput,
            target: States.searching,
          },
        ],
        [Events.resultsFound]: States.resultsFound,
        [Events.noResults]: States.noResults,
        [Events.searchFailed]: States.searchFailed,
      },
    },
    [States.noResults]: {
      transitions: {
        [Events.inputChanged]: [
          {
            guard: (event: InputChangedEvent) => event.payload.length == 0,
            command: this.storeInput,
            target: States.noInput,
          },
          {
            guard: (event: InputChangedEvent) => event.payload.length > 0,
            command: this.storeInput,
            target: States.searching,
          },
        ],
      },
    },
    [States.searchFailed]: {
      transitions: {
        [Events.inputChanged]: [
          {
            guard: (event: InputChangedEvent) => event.payload.length == 0,
            command: this.storeInput,
            target: States.noInput,
          },
          {
            guard: (event: InputChangedEvent) => event.payload.length > 0,
            command: this.storeInput,
            target: States.searching,
          },
        ],
      },
    },
    [States.resultsFound]: {
      transitions: {
        [Events.inputChanged]: [
          {
            guard: (event: InputChangedEvent) => event.payload.length == 0,
            command: this.storeInput,
            target: States.noInput,
          },
          {
            guard: (event: InputChangedEvent) => event.payload.length > 0,
            command: this.storeInput,
            target: States.searching,
          },
        ],
      },
    },
  };

  *storeInput(event: InputChangedEvent): Generator<StrictEffect, void> {
    yield* this.setContext(ctx => {
      ctx.input = event.payload;
    });
  }

  *search(): Generator<StrictEffect, void> {
    yield delay(300);
    try {
      const results = (yield call(API.search, this.context.input!)) as string[];
      yield* this.setContext(ctx => {
        ctx.results = results;
      });
      if (results.length > 0) {
        yield put({ type: Events.resultsFound });
      } else {
        yield put({ type: Events.noResults });
      }
    } catch (e) {
      yield put({ type: Events.searchFailed });
    }
  }
}

const stateMachine = new SearchStateMachine();

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  search: stateMachine.stateReducer,
});

createStore(rootReducer, applyMiddleware(sagaMiddleware));

type Store = ReturnType<typeof rootReducer>;

sagaMiddleware.run(stateMachineStarterSaga, stateMachine);

function* rootSaga(): Generator<StrictEffect, void> {
  yield put(stateMachine.start({}));

  let state = (yield select((state: Store) => state.search)) as StmStorage<
    States,
    Context
  >;

  console.log('initial state:', state.state);
  console.log('initial input:', state.context!.input);

  console.log('changing input to', '1');
  yield put({ type: Events.inputChanged, payload: '1' });
  yield take(storeStmStateActionType); // wait for the state machine to change state

  state = (yield select((state: Store) => state.search)) as StmStorage<
    States,
    Context
  >;

  console.log('state:', state.state);
  console.log('input:', state.context!.input);

  yield take(Events.resultsFound);
  yield take(storeStmStateActionType); // wait for the state machine to change state
  console.log('results found');

  state = (yield select((state: Store) => state.search)) as StmStorage<
    States,
    Context
  >;

  console.log('state:', state.state);
  console.log('results:', state.context!.results);

  console.log('changing input to', 'res');
  yield put({ type: Events.inputChanged, payload: 'res' });
  yield take(storeStmStateActionType); // wait for the state machine to change state

  state = (yield select((state: Store) => state.search)) as StmStorage<
    States,
    Context
  >;

  console.log('state:', state.state);
  console.log('input:', state.context!.input);

  console.log('changing input to', 'response');
  yield put({ type: Events.inputChanged, payload: 'response' });
  yield take(storeStmStateActionType); // wait for the state machine to change state

  state = (yield select((state: Store) => state.search)) as StmStorage<
    States,
    Context
  >;

  console.log('state:', state.state);
  console.log('input:', state.context!.input);

  yield take(Events.noResults);
  yield take(storeStmStateActionType); // wait for the state machine to change state
  console.log('no results found');

  state = (yield select((state: Store) => state.search)) as StmStorage<
    States,
    Context
  >;

  console.log('state:', state.state);
}

sagaMiddleware.run(rootSaga);

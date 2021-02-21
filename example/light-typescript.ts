/* eslint-disable no-console */
import { StateMachine, stateMachineStarterSaga } from '../src';
import { Action, applyMiddleware, combineReducers, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { delay, call, put, take, select } from 'redux-saga/effects';
import { API } from './api';
import { storeStmStateActionType } from '../src/constants';

interface Context {
  input?: string;
  results?: string[];
}

interface InputChangedEvent extends Action {
  payload: string;
}

class SearchStateMachine extends StateMachine<string, string, string, Context> {
  readonly name = 'search';

  protected readonly initialState = 'no_input';

  protected readonly spec = {
    no_input: {
      transitions: {
        input_changed: {
          guard: (event: InputChangedEvent) => event.payload.length > 0,
          command: this.storeInput,
          target: 'searching',
        },
      },
    },
    searching: {
      onEntry: this.search,
      transitions: {
        input_changed: [
          {
            guard: (event: InputChangedEvent) => event.payload.length == 0,
            command: this.storeInput,
            target: 'no_input',
          },
          {
            guard: (event: InputChangedEvent) => event.payload.length > 0,
            command: this.storeInput,
            target: 'searching',
          },
        ],
        results_found: 'results_found',
        no_results: 'no_results',
        search_failed: 'search_failed',
      },
    },
    no_results: {
      transitions: {
        input_changed: [
          {
            guard: (event: InputChangedEvent) => event.payload.length == 0,
            command: this.storeInput,
            target: 'no_input',
          },
          {
            guard: (event: InputChangedEvent) => event.payload.length > 0,
            command: this.storeInput,
            target: 'searching',
          },
        ],
      },
    },
    search_failed: {
      transitions: {
        input_changed: [
          {
            guard: (event: InputChangedEvent) => event.payload.length == 0,
            command: this.storeInput,
            target: 'no_input',
          },
          {
            guard: (event: InputChangedEvent) => event.payload.length > 0,
            command: this.storeInput,
            target: 'searching',
          },
        ],
      },
    },
    results_found: {
      transitions: {
        input_changed: [
          {
            guard: (event: InputChangedEvent) => event.payload.length == 0,
            command: this.storeInput,
            target: 'no_input',
          },
          {
            guard: (event: InputChangedEvent) => event.payload.length > 0,
            command: this.storeInput,
            target: 'searching',
          },
        ],
      },
    },
  };

  *storeInput(event: InputChangedEvent) {
    yield* this.setContext(ctx => {
      ctx.input = event.payload;
    });
  }

  *search() {
    yield delay(300);
    try {
      const results = yield call(API.search, this.context.input!);
      yield* this.setContext(ctx => {
        ctx.results = results;
      });
      if (results.length > 0) {
        yield put({ type: 'results_found' });
      } else {
        yield put({ type: 'no_results' });
      }
    } catch (e) {
      yield put({ type: 'search_failed' });
    }
  }
}

const stateMachine = new SearchStateMachine();

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  search: stateMachine.stateReducer,
});

createStore(rootReducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(stateMachineStarterSaga, stateMachine);

function* rootSaga() {
  yield put(stateMachine.start({}));

  yield put({ type: 'wait for redux saga to flush action queue ' });

  let state = yield select(state => state.search);

  console.log('initial state:', state.state);
  console.log('initial input:', state.context.input);

  console.log('changing input to', '1');
  yield put({ type: 'input_changed', payload: '1' });
  yield take(storeStmStateActionType); // wait for the state machine to change state

  state = yield select(state => state.search);

  console.log('state:', state.state);
  console.log('input:', state.context.input);

  yield take('results_found');
  yield take(storeStmStateActionType); // wait for the state machine to change state
  console.log('results found');

  state = yield select(state => state.search);

  console.log('state:', state.state);
  console.log('results:', state.context.results);

  console.log('changing input to', 'res');
  yield put({ type: 'input_changed', payload: 'res' });
  yield take(storeStmStateActionType); // wait for the state machine to change state

  state = yield select(state => state.search);

  console.log('state:', state.state);
  console.log('input:', state.context.input);

  console.log('changing input to', 'response');
  yield put({ type: 'input_changed', payload: 'response' });
  yield take(storeStmStateActionType); // wait for the state machine to change state

  state = yield select(state => state.search);

  console.log('state:', state.state);
  console.log('input:', state.context.input);

  yield take('no_results');
  yield take(storeStmStateActionType); // wait for the state machine to change state
  console.log('no results found');

  state = yield select(state => state.search);

  console.log('state:', state.state);
}

sagaMiddleware.run(rootSaga);

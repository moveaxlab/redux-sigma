<h1>redux sigma <img src="https://github.com/moveaxlab/redux-sigma/blob/master/assets/logo.png?raw=true" alt="redux-sigma" height="30px" /></h1>

developed with :heart: by [**moveax**](https://moveax.it/)

[![npm](https://img.shields.io/npm/v/redux-sigma)](https://www.npmjs.com/package/redux-sigma)
[![Test CI](https://github.com/moveaxlab/redux-sigma/workflows/Test%20CI/badge.svg?branch=master)](https://github.com/moveaxlab/redux-sigma/actions)

`redux-sigma` is a library that allows implementation of state machines on top
of `redux` and `redux-saga`.

State machines implemented with `redux-sigma` react to events dispatched via `redux`,
and their state can be stored inside `redux` using a dedicated reducer.

The aim of `redux-sigma` is providing developers with a formal framework
that can be used when dealing with complex business flows inside front-end applications.

Being based on `redux-saga`, `redux-sigma` expects all your redux actions to follow
the [FSA](https://github.com/redux-utilities/flux-standard-action) pattern.

`redux-sigma` has extensive TypeScript support, and we recommend using it with TypeScript.

You can read what features `redux-sigma` offers in the
[docs](https://github.com/moveaxlab/redux-sigma/tree/master/docs),
or you can start by reading the quick start below.

## Installation

```bash
$ yarn add redux-sigma
```

`redux-sigma` has `redux` and `redux-saga` as peer dependencies.
Remember to include them in your project.

## Quick Start

State machines in `redux-sigma` must extend a generic `StateMachine` class.

The simplest way to define a state machine is to extend the `StateMachine` class,
and to define its abstract fields:

```typescript
import { StateMachine } from 'redux-sigma';

class MyStateMachine extends StateMachine {
  initialState = 'first_state';

  name = 'my_state_machine';

  spec = {
    first_state: {
      transitions: {
        first_event: 'second_state',
      },
    },
    second_state: {
      transitions: {
        second_event: 'first_state',
      },
    },
  };
}
```

This state machine can be represented graphically as follows:

![A simple state machine](https://github.com/moveaxlab/redux-sigma/raw/master/assets/simple-state-machine.png?raw=true)

The `spec` field is the actual _specification_ of the state machine:
an high level description of what its states are, and how the state machines
goes from one state to another.
More on this [later](#state-machines-specification).

The `initialState` field indicates what will be the state of the state machine
when it first starts.

The `name` field is what identifies state machines: for `redux-sigma`,
two state machines cannot have the same name.

### Running your state machine

To use a state machine, you first need to instantiate it:

```typescript
export const myStateMachine = new MyStateMachine();
```

Then, you must connect your state machine to `redux` via `redux-saga`.

`redux-sigma` provides a `stateMachineStarterSaga` utility to coordinate state machines startup
that integrates with your `redux` store and your `redux-saga` middleware.

```typescript
import { createStore, applyMiddleware } from 'redux';
import { createSagaMiddleware } from 'redux-saga';
import { stateMachineStarterSaga } from 'redux-sigma';
import { rootReducer } from './root-reducer';
import { myStateMachine } from './my-state-machine';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(stateMachineStarterSaga, myStateMachine);
```

> Having more than one state machine with the same name
> or two instances of the same state machine passed to `stateMachineStarterSaga`
> will crash `redux-sigma`!

State machines can be started and stopped by dispatching actions to `redux`:

```typescript
store.dispatch(myStateMachine.start({}));

store.dispatch(myStateMachine.stop());
```

Multiple `start` actions dispatched one after another have no effect on the state machine:
the state machine is started only once.
The same is true for `stop` actions.
To restart a running state machine, dispatch a `stop` action followed by a `start` action.

### Reading data from your state machine

To have the state of your state machines available inside your `redux` store,
use the `stateReducer` of the state machine:

```typescript
import { combineReducers } from 'redux';
import { myStateMachine } from './my-state-machine';

const rootReducer = combineReducers({
  my_state_machine: myStateMachine.stateReducer,
});
```

While the state machine is not running, its state will look like this:

```typescript
console.log(store.getState().my_state_machine);
// { state: null }
```

Once the state machine starts running, its state will look like this:

```typescript
store.dispatch(myStateMachine.start({}));

console.log(store.getState().my_state_machine);
// { state: 'first_state', context: {} }
```

The state and the context of the state machines will be updated independently
during the state machine lifetime, according to its specification.

You can find a more detailed example in the [example](https://github.com/moveaxlab/redux-sigma/tree/master/example) folder.

---



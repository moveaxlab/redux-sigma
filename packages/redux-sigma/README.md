# redux-sigma

`redux-sigma` is a library that allows implementation of state machines on top
of `redux` and `redux-saga`.

State machines implemented with `redux-sigma` react to events dispatched via `redux`,
and their state can be stored inside `redux` using a dedicated reducer.

The aim of `redux-sigma` is providing developers with a formal framework
that can be used when dealing with complex business flows inside front-end applications.

Being based on `redux-saga`, `redux-sigma` expects all your redux actions to follow
the [FSA](https://github.com/redux-utilities/flux-standard-action) pattern.

`redux-sigma` has extensive TypeScript support, and we recommend using it with TypeScript.

## Installation

```bash
$ yarn add redux-sigma
```

```bash
$ npm install redux-sigma
```

## Basic usage

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

The `spec` field is the actual _specification_ of the state machine:
an high level description of what its states are, and how the state machines
goes from one state to another.
More on this [later](#state-machines-specification).

The `initialState` field indicates what will be the state of the state machine
when it first starts.

The `name` field is what identifies state machines: for `redux-sigma`, no two
state machines can have the same name.

To use a state machine, you first need to instantiate it:

```typescript
export const myStateMachine = new MyStateMachine();
```

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

State machines can be started and stopped by dispatching actions to `redux`:

```typescript
store.dispatch(myStateMachine.start({}));

store.dispatch(myStateMachine.stop());
```

To have the state of your state machines available inside your `redux` store,
use the `stateReducer` of the state machine:

```typescript
import { combineReducers } from 'redux';
import { myStateMachine } from './my-state-machine';

const rootReducer = combineReducers({
  my_state_machine: myStateMachine.stateReducer,
});
```

## State machines specification

The `spec` field of each state machine is an object.
Its keys represent the state names (or identifiers) of your state machine:

```typescript
class MyStateMachine extends StateMachine {
  spec = {
    state_1: { /* definition of state 1 */ },
    state_2: { /* definition of state 2 */ },
    state_3: { /* definition of state 3 */ },
  };
}
```

Each state definition can contain several fields:

```typescript
class MyStateMachine extends StateMachine {
  spec = {
    state_1: {
      onEntry: [ /* activities that will run upon entering the state */ ],
      subMachines: [ /* other state machines that will run while in this state */ ],
      transitions: { /* transition definition */ },
      reactions: { /* reactions (or internal transitions) definition */ },
      onExit: [ /* activities that will run upon exiting the state */ ],
    },
  };
}
```

All fields are optional, and are described in the detail in the following sections.

### `transitions`

Transitions are the core of all state machines: they define how the state of the state machine
evolves in response to events that happen in your application.

The `transitions` field is an object mapping events (which are the `type` of your `redux` actions)
to the state that your state machine will reach upon receiving that event.

```typescript
class MyStateMachine extends StateMachine {
  spec = {
    state_1: {
      transitions: {
        event_1: 'state_2',
      },
    },
    state_2: { /* ... */ },
  };
}
```

The transition from `state_1` to `state_2` will be triggered by any `redux` action
having a `type` equal to `'event_1'`:

```typescript
// this action would trigger the transition
store.dispatch({ type: 'event_1' });

// this action would trigger the transition too
store.dispatch({ type: 'event_1', payload: { value: 'something something'} });
```

#### Running activities on transition

Sometimes you may want to perform an activity when doing a specific transition.
`redux-sigma` allows you to specify the activity that must be performed on a given transition:

```typescript
class MyStateMachine extends StateMachine {
  spec = {
    state_1: {
      transitions: {
        event_1: 'state_2',
        event_2: {
          target: 'state_3',
          command: this.transitionActivity,
        },
      },
    },
    state_2: { /* ... */ },
    state_3: { /* ... */ },
  };

  *transitionActivity(event) {
    // do something with `event`
  }
}
```

The `target` in the `event_2` transition identifies the state that your state machine will reach
after executing the `command`.

Commands can be regular functions or generators (sagas), or an array of both.
They receive in input the event that triggered the transition.
There is no guarantee on the order in which commands are executed when performing the transition,
but all commands will execute to completion before entering the `target` state.

#### Conditional transitions: `guard`s

For more advanced use-cases, you may want to perform a transition when receiving an event
but _only_ if some conditions are met.
This is know as a **guard** in UML State Machines and StateCharts.

Guards can be implemented in `redux-sigma` with this syntax:

```typescript
class MyStateMachine extends StateMachine {
  spec = {
    state_1: {
      transitions: {
        event_1: {
          guard: (event, context) => { /* return true if transition should trigger */ },
          target: 'state_2',
        },
        event_2: [
          {
            guard: (event, context) => { /* ... */ },
            target: 'state_2',
          },
          {
            guard: (event, context) => { /* ... */ },
            target: 'state_3',
            command: this.transitionActivity,
          },
        ],
      },
    },
    state_2: { /* ... */ },
    state_3: { /* ... */ },
  };
}
```

For `event_1`, the transition will be triggered only if the `guard` function returns `true`,
otherwise nothing will happen.

For `event_2`, we have defined an array of possible transitions:
the only transition that will be triggered is the one for which the `guard` function returns `true`.

There is no guarantee on the order in which `guard`s are executed:
it's up to you to make sure that at most one `guard` returns `true` for any given input.

Note that the `event_2` transition to `state_3` contains a command:
this command will run if that specific transition is triggered.

All `guard`s receive in input the event that could trigger the transition,
and the current `context` of the state machine.
More on the context later.

### `onEntry` and `onExit` activities

The `onEntry` and `onExit` fields are an array that mixes functions and generators (sagas).
They receive nothing in input and must not return anything.
Both arrays can contain methods of the state machine class.

If your state has only one `onEntry` or one `onExit`, you can use this short-hand syntax:

```typescript
class MyStateMachine extends StateMachine {
  spec = {
    state_1: {
      onEntry: this.onEntry,
      onExit: this.onExit,
    },
  };
}
```

The `onEntry` activities will start running as soon as your state machine enters the state.
While `onEntry` activities are running, the state machine can change state if it receives
one of the events described among its `transitions`.
If a transition happens, `onEntry` activities will be stopped
(using the [`cancel`](https://redux-saga.js.org/docs/api/#canceltask) effect of `redux-saga`).

The `onExit` activities will run when your state machine exits the state,
or when your state machine is stopped while in that specific state.
They always run to completion before exiting the state.

There is no guarantee about the order in which `onEntry` and `onExit` activities are run
inside a state.

# @redux-sigma/react

![npm](https://img.shields.io/npm/v/@redux-sigma/react)

This package contains a hook to start `redux-sigma` state machines when a component is mounted.

The hook is given the state machine context in input,
and will restart the state machine when the context changes.

## Installation

```bash
$ npm install --save @redux-sigma/react
```

or

```bash
$ yarn add @redux-sigma/react
```

## Usage

Use the hook in your component:

```tsx
import React from 'react';
import { useStateMachine } from '@redux-sigma/react';
import { myStateMachine } from './my-state-machine';

export function MyComponent() {
  useStateMachine(myStateMachine, {}); // pass the initial context to your state machine

  return (
    /* your component */
  );
}
```

import { Channel, StrictEffect, Task } from '@redux-saga/types';
import produce from 'immer';
import { AnyAction } from 'redux';
import {
  actionChannel,
  call,
  cancel,
  fork,
  put,
  putResolve,
  take,
} from 'redux-saga/effects';
import {
  REACTION_POLICY_ALL,
  REACTION_POLICY_FIRST,
  REACTION_POLICY_LAST,
  startStmActionType,
  stopStmActionType,
  storeStmContextActionType,
  storeStmStateActionType,
} from './constants';
import { StateMachineSpec } from './spec';
import {
  isFunction,
  isGuardedTransition,
  isReactionSpec,
  isSimpleTransition,
  isStarted,
  isStateTransition,
} from './typeGuards';
import { AnyEvent, Event } from './spec/events';
import { Activity } from './spec/activities';
import { TransitionSpec, TransitionTrigger } from './spec/transitions';
import { ReactionPolicy } from './spec/reactions';
import { StmStorage } from './spec/storage';
import {
  StartStateMachineAction,
  StopStateMachineAction,
  StoreStateMachineContext,
  StoreStateMachineState,
} from './spec/actions';
import { StateMachineInterface } from './spec/base';

export abstract class StateMachine<
  E extends string = string,
  S extends string = string,
  SM extends string = string,
  C = {},
  IS extends S = S,
  N extends SM = SM
> implements StateMachineInterface<SM, C> {
  abstract readonly name: N;

  private _context!: C;

  protected abstract readonly spec: StateMachineSpec<E, S, SM, C>;

  protected abstract readonly initialState: IS;

  private runningTasks: Task[] = [];

  private currentState!: S;

  private transitionChannel!: Channel<AnyEvent<E>>;

  /**
   * Returns a redux action that will start this state machine when dispatched,
   * with the initial context provided in input.
   *
   * @param context The initial context of the state machine.
   */
  start = (context: C): StartStateMachineAction<N, C> => {
    const initialContext = produce(null, () => context) as C;
    return {
      type: startStmActionType,
      payload: {
        name: this.name,
        context: initialContext,
      },
    };
  };

  /**
   * Returns a redux action that will stop this state machine when dispatched.
   */
  stop = (): StopStateMachineAction<N> => {
    return {
      type: stopStmActionType,
      payload: {
        name: this.name,
      },
    };
  };

  /**
   * Returns an action that will update the state of this state machine stored
   * by the `stateReducer`.
   *
   * @param state The new state.
   */
  private storeState = (state: S): StoreStateMachineState<N, S> => {
    return {
      type: storeStmStateActionType,
      payload: {
        name: this.name,
        state,
      },
    };
  };

  /**
   * Returns an action that will update the context of this state machine stored
   * by the `stateReducer`.
   *
   * @param context The new context.
   */
  private storeContext = (context: C): StoreStateMachineContext<N, C> => {
    return {
      type: storeStmContextActionType,
      payload: {
        name: this.name,
        context,
      },
    };
  };

  /**
   * Computes the new context and stores it using `storeContext`.
   *
   * @param newContext The new context, or an immer-style function that mutates
   * the current context.
   */
  protected *setContext(newContext: C | ((ctx: C) => void)) {
    if (isFunction(newContext)) {
      this._context = produce(this._context, newContext);
    } else {
      this._context = produce(null, () => newContext) as C;
    }
    yield putResolve(this.storeContext(this._context));
  }

  /**
   * Returns the current context.
   */
  get context(): C {
    return this._context;
  }

  /**
   * This saga is responsible for starting and stopping this state machine.
   * It listens to the `start` and `stop` actions returned by the methods of
   * this state machine.
   *
   * This saga shouldn't be used directly: rely on `stateMachineStarterSaga`
   * instead.
   */
  *starterSaga(): Generator<StrictEffect, void> {
    while (true) {
      const action = (yield take(
        (action: AnyAction) =>
          action.type === startStmActionType &&
          action.payload &&
          action.payload.name === this.name
      )) as StartStateMachineAction<N, C>;

      const task = (yield fork(
        [this, this.run],
        action.payload.context
      )) as Task;

      yield take(
        (action: AnyAction) =>
          action.type === stopStmActionType &&
          action.payload &&
          action.payload.name === this.name
      );

      yield cancel(task);
    }
  }

  /**
   * Runs the state machine described by this state machines' spec.
   */
  private *run(context: C): Generator<StrictEffect, void> {
    this._context = context;

    this.currentState = this.initialState;

    while (true) {
      const nextState = (yield call([
        this,
        this.stateLoop,
      ])) as TransitionTrigger<S, E>;

      if (nextState.command) {
        if (Array.isArray(nextState.command)) {
          for (const saga of nextState.command) {
            yield call([this, saga], nextState.event);
          }
        } else {
          yield call([this, nextState.command], nextState.event);
        }
      }

      this.currentState = nextState.nextState;

      yield put(this.storeState(this.currentState));
    }
  }

  /**
   * A generator that runs the "loop" for the current state.
   * It listens to transition events while running `onEntry` activities and
   * `reactions`, and starts sub state machines. As soon as a transition event
   * is returned, the state loop is stopped, and the transition trigger is
   * returned to the calling function.
   */
  private *stateLoop(): Generator<StrictEffect, TransitionTrigger<S, E>> {
    try {
      const { transitions } = this.spec[this.currentState];

      const transitionEvents = transitions
        ? (Object.keys(transitions) as E[])
        : [];

      this.transitionChannel = (yield actionChannel(
        transitionEvents
      )) as Channel<AnyEvent<E>>;

      this.runningTasks.push(
        (yield fork([this, this.startOnEntryActivities])) as Task
      );

      this.runningTasks.push(
        (yield fork([this, this.registerToReactions])) as Task
      );

      yield* this.startSubMachines();

      return (yield call([this, this.getNextState])) as TransitionTrigger<S, E>;
    } finally {
      yield* this.cancelRunningTasks();
      yield* this.stopSubMachines();
      yield* this.runOnExitActivities();
    }
  }

  /**
   * Waits for the first event matching a regular transition or a guarded
   * transition, and returns it together with the next state and the
   * optional command (or commands) that must be executed before transitioning.
   */
  private *getNextState(): Generator<StrictEffect, TransitionTrigger<S, E>> {
    while (true) {
      const event = (yield take(this.transitionChannel)) as Event<E>;

      const transitionSpec = this.spec[this.currentState].transitions![
        event.type
      ]! as TransitionSpec<S, E, C>;

      if (isStateTransition(transitionSpec)) {
        return {
          event,
          nextState: transitionSpec,
        };
      } else if (isSimpleTransition(transitionSpec)) {
        return {
          event,
          nextState: transitionSpec.target,
          command: transitionSpec.command,
        };
      } else if (isGuardedTransition(transitionSpec)) {
        if (yield call(transitionSpec.guard, event, this.context)) {
          return {
            event,
            nextState: transitionSpec.target,
            command: transitionSpec.command,
          };
        }
      } else {
        for (const transitionOption of transitionSpec) {
          if (yield call(transitionOption.guard, event, this.context))
            return {
              event,
              nextState: transitionOption.target,
              command: transitionOption.command,
            };
        }
      }
    }
  }

  /**
   * This reducer stores the current state of the State Machine. It can be
   * added to your application reducers if you need to access the state of a
   * State Machine somewhere in your application.
   *
   * @param state  The current state and context.
   * @param action The action taken by the reducer.
   */
  stateReducer = (
    state: StmStorage<S, C> = { state: null, context: undefined },
    action:
      | StoreStateMachineState<N, S>
      | StartStateMachineAction<N, C>
      | StopStateMachineAction<N>
      | StoreStateMachineContext<N, C>
  ): StmStorage<S, C> => {
    if (action.payload?.name !== this.name) {
      return state;
    }

    switch (action.type) {
      case startStmActionType:
        if (!isStarted(state)) {
          return {
            state: this.initialState,
            context: action.payload.context,
          };
        } else {
          return state;
        }

      case stopStmActionType:
        return {
          state: null,
          context: undefined,
        };

      case storeStmContextActionType:
        if (!isStarted(state)) {
          return state;
        } else {
          return {
            state: state.state,
            context: action.payload.context,
          };
        }

      case storeStmStateActionType:
        if (isStarted(state)) {
          return {
            state: action.payload.state,
            context: state.context,
          };
        } else {
          return state;
        }
    }
  };

  /**
   * Starts all onEntry activities. Does not wait for them to complete.
   */
  private *startOnEntryActivities(): Generator<StrictEffect, void> {
    const { onEntry } = this.spec[this.currentState];

    if (onEntry) {
      if (Array.isArray(onEntry)) {
        for (const saga of onEntry) {
          this.runningTasks.push((yield fork([this, saga])) as Task);
        }
      } else {
        this.runningTasks.push((yield fork([this, onEntry])) as Task);
      }
    }
  }

  /**
   * Starts and adds the background tasks listening to reactions
   * in the background task list.
   */
  private *registerToReactions(): Generator<StrictEffect, void> {
    const { reactions } = this.spec[this.currentState];
    if (reactions) {
      const eventTypes = Object.keys(reactions) as E[];

      for (const eventType of eventTypes) {
        const reaction = reactions[eventType]! as Activity<E>;

        const [activity, policy] = isReactionSpec(reaction)
          ? [reaction.activity, reaction.policy]
          : [reaction, REACTION_POLICY_ALL as ReactionPolicy];

        let task: Task;

        switch (policy) {
          case REACTION_POLICY_LAST: {
            task = (yield fork(
              [this, this.takeLast],
              eventType,
              activity
            )) as Task;
            break;
          }
          case REACTION_POLICY_FIRST: {
            task = (yield fork(
              [this, this.takeFirst],
              eventType,
              activity
            )) as Task;
            break;
          }
          case REACTION_POLICY_ALL: {
            task = (yield fork(
              [this, this.takeAll],
              eventType,
              activity
            )) as Task;
            break;
          }
        }
        //enqueue task
        this.runningTasks.push(task);
      }
    }
  }

  /**
   * Implements the `first` reaction policy: once an event triggering a reaction
   * is received, no other event are processed until the first event has
   * complete its processing.
   *
   * @param eventType The event triggering the reaction
   * @param activity The reaction activity
   */
  private *takeFirst(
    eventType: E,
    activity: Activity<E>
  ): Generator<StrictEffect, void> {
    while (true) {
      const event = (yield take(eventType)) as AnyEvent<E>;
      yield call([this, activity], event);
    }
  }

  /**
   * Implements the `last` reaction policy: events are processed as they come.
   * If a new event is received while a reaction is running, the old reaction
   * is stopped, and a new reaction starts running.
   *
   * @param eventType The event triggering the reaction
   * @param activity The reaction activity
   */
  private *takeLast(
    eventType: E,
    activity: Activity<E>
  ): Generator<StrictEffect, Task> {
    const channel = (yield actionChannel(eventType)) as Channel<AnyEvent<E>>;
    let task: Task | null = null;
    while (true) {
      const event = (yield take(channel)) as AnyEvent<E>;
      if (task !== null) {
        yield cancel(task);
      }
      task = (yield fork([this, activity], event)) as Task;
    }
  }

  /**
   * Implements the `all` reaction policy: events that can trigger a reaction
   * are stored in a queue, and processed sequentially.
   *
   * @param eventType The event triggering the reaction
   * @param activity The reaction activity
   */
  private *takeAll(
    eventType: E,
    activity: Activity<E>
  ): Generator<StrictEffect, Task> {
    const channel = (yield actionChannel(eventType)) as Channel<AnyEvent<E>>;
    while (true) {
      const event = (yield take(channel)) as AnyEvent<E>;
      yield call([this, activity], event);
    }
  }

  /**
   * Stops all running tasks. Used when exiting from a state
   * or when the state machine is stopped.
   */
  private *cancelRunningTasks(): Generator<StrictEffect, void> {
    yield cancel(this.runningTasks);
    this.runningTasks = [];
  }

  /**
   * Starts all sub state machines for the current state..
   */
  private *startSubMachines(): Generator<StrictEffect, void> {
    let { subMachines } = this.spec[this.currentState];

    if (!subMachines) return;

    if (!Array.isArray(subMachines)) {
      subMachines = [subMachines];
    }

    for (const subMachine of subMachines) {
      if ('stm' in subMachine) {
        const ctx = yield call([this, subMachine.contextBuilder]);
        yield put(subMachine.stm.start(ctx));
      } else {
        yield put(subMachine.start({}));
      }
    }
  }

  /**
   * Stops all state machines for the current state.
   */
  private *stopSubMachines(): Generator<StrictEffect, void> {
    let { subMachines } = this.spec[this.currentState];

    if (!subMachines) return;

    if (!Array.isArray(subMachines)) {
      subMachines = [subMachines];
    }

    for (const subMachine of subMachines) {
      if ('stm' in subMachine) {
        yield put(subMachine.stm.stop());
      } else {
        yield put(subMachine.stop());
      }
    }
  }

  /**
   * Runs all onExit activities, and waits for them to return before continuing.
   */
  private *runOnExitActivities(): Generator<StrictEffect, void> {
    const { onExit } = this.spec[this.currentState];

    if (onExit) {
      if (Array.isArray(onExit)) {
        for (const saga of onExit) {
          yield call([this, saga]);
        }
      } else {
        yield call([this, onExit]);
      }
    }
  }
}

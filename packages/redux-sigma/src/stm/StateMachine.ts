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
} from '../constants';
import {
  Activity,
  AnyEvent,
  Event,
  GuardedTransition,
  StartStateMachineAction,
  StateMachineInterface,
  StateMachineSpec,
  StmStorage,
  StopStateMachineAction,
  StoreStateMachineContext,
  StoreStateMachineState,
  TransitionTrigger,
} from '../types';
import {
  isArray,
  isFunction,
  isGuardedTransition,
  isGuardedTransitionArray,
  isReactionSpec,
  isSimpleTransition,
  isStarted,
  isStateTransition,
} from '../utils/typeGuards';

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

  stop = (): StopStateMachineAction<N> => {
    return {
      type: stopStmActionType,
      payload: {
        name: this.name,
      },
    };
  };

  private storeState = (state: S): StoreStateMachineState<N, S> => {
    return {
      type: storeStmStateActionType,
      payload: {
        name: this.name,
        state,
      },
    };
  };

  private storeContext = (context: C): StoreStateMachineContext<N, C> => {
    return {
      type: storeStmContextActionType,
      payload: {
        name: this.name,
        context,
      },
    };
  };

  protected *setContext(newContext: C | ((ctx: C) => void)) {
    if (isFunction(newContext)) {
      this._context = produce(this._context, newContext);
    } else {
      this._context = produce(null, () => newContext) as C;
    }
    yield putResolve(this.storeContext(this._context));
  }

  get context(): C {
    return this._context;
  }

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
   * Runs the State Machine described by the spec. To stop the State
   * machine, cancel the task. Or, better still, rely on the
   * `stateMachineStarterSaga` utility function.
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
        if (isArray(nextState.command)) {
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
   * optional command that must be executed before transitioning.
   */
  private *getNextState(): Generator<StrictEffect, TransitionTrigger<S, E>> {
    while (true) {
      const event = (yield take(this.transitionChannel)) as Event<E>;

      const transitionSpec = this.spec[this.currentState].transitions![
        event.type
      ]!;

      if (isStateTransition<S, E, C>(transitionSpec)) {
        return {
          event,
          nextState: transitionSpec,
        };
      } else if (isSimpleTransition<S, E, C>(transitionSpec)) {
        return {
          event,
          nextState: transitionSpec.target,
          command: transitionSpec.command,
        };
      } else if (isGuardedTransition<S, E, C>(transitionSpec)) {
        if (yield call(transitionSpec.guard, event, this.context)) {
          return {
            event,
            nextState: transitionSpec.target,
            command: transitionSpec.command,
          };
        }
      } else if (isGuardedTransitionArray<S, E, C>(transitionSpec)) {
        for (const transitionOption of transitionSpec as GuardedTransition<
          S,
          E,
          C
        >[]) {
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
   * @param state  The current state (`null` if not running).
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
      if (isArray(onEntry)) {
        for (const saga of onEntry) {
          this.runningTasks.push((yield fork([this, saga])) as Task);
        }
      } else {
        this.runningTasks.push((yield fork([this, onEntry])) as Task);
      }
    }
  }

  /**
   * Starts and add the background task listening to reactions
   * in the background task list
   */
  private *registerToReactions(): Generator<StrictEffect, void> {
    const { reactions } = this.spec[this.currentState];
    if (reactions) {
      const eventTypes = Object.keys(reactions) as E[];

      for (const eventType of eventTypes) {
        const reaction = reactions[eventType]! as Activity<E>;

        const activity = isReactionSpec(reaction)
          ? reaction.activity
          : reaction;

        const policy = isReactionSpec(reaction)
          ? reaction.policy
          : REACTION_POLICY_ALL;

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

  //Reactions Policies

  /**
   * takes the first available event and process it. When done take the next emitted event of the same kind until task is cancelled
   * @param e: the event we are waiting for
   * @param activity: the activity to be executed once the event is received
   */
  private *takeFirst(
    e: E,
    activity: Activity<E>
  ): Generator<StrictEffect, void> {
    while (true) {
      const event = (yield take(e)) as AnyEvent<E>;
      yield call([this, activity], event);
    }
  }

  /**
   * takes every event e emitted and launches the activity with it.
   * if another event e is emitted during activity execution
   * previous processing is cancelled and a new one with the new event starts
   * @param e: the event we are waiting for
   * @param activity the activity to be executed once the event is received
   */
  private *takeLast(
    e: E,
    activity: Activity<E>
  ): Generator<StrictEffect, Task> {
    const channel = (yield actionChannel(e)) as Channel<AnyEvent<E>>;
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
   * takes all event emitted one at time and sequentially launches activity
   * @param e: the event we are waiting for
   * @param activity the activity to be executed once the event is received
   */
  private *takeAll(e: E, activity: Activity<E>): Generator<StrictEffect, Task> {
    const channel = (yield actionChannel(e)) as Channel<AnyEvent<E>>;
    while (true) {
      const event = (yield take(channel)) as AnyEvent<E>;
      yield call([this, activity], event);
    }
  }

  /**
   * Stops all running tasks. Used when exiting from a state or when the STM
   * is cancelled.
   */
  private *cancelRunningTasks(): Generator<StrictEffect, void> {
    yield cancel(this.runningTasks);
    this.runningTasks = [];
  }

  /**
   * Starts all STMs.
   */
  private *startSubMachines(): Generator<StrictEffect, void> {
    let { subMachines } = this.spec[this.currentState];

    if (!subMachines) return;

    if (!isArray(subMachines)) {
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
   * Stops all sub STMs.
   */
  private *stopSubMachines(): Generator<StrictEffect, void> {
    let { subMachines } = this.spec[this.currentState];

    if (!subMachines) return;

    if (!isArray(subMachines)) {
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
      if (isArray(onExit)) {
        for (const saga of onExit) {
          yield call([this, saga]);
        }
      } else {
        yield call([this, onExit]);
      }
    }
  }
}

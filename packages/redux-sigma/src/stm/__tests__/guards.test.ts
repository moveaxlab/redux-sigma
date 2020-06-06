import { Action, combineReducers } from 'redux';
import SagaTester from 'redux-saga-tester';
import { StateMachine } from '../running';
import { stateMachineStarterSaga } from '../startup';
import {
  Events,
  firstEvent,
  secondEvent,
  simpleEvent,
  StateMachineNames,
  States,
} from './definitions.utils';

const guard = jest.fn();
const command = jest.fn();

const commandSaga = jest.fn();

interface GuardedStmContext {
  condition: boolean;
}

interface GuardedEvent extends Action<Events.payload> {
  payload: string;
}

export class GuardedStateMachine extends StateMachine<
  Events,
  States,
  StateMachineNames,
  GuardedStmContext
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.guarded;

  protected readonly spec = {
    [States.first]: {
      reactions: {
        [Events.simple]: this.toggleCondition,
      },
      transitions: {
        [Events.payload]: {
          target: States.third,
          guard: (event: GuardedEvent) => event.payload.length > 10,
        },
        [Events.second]: {
          target: States.second,
          command: commandSaga,
          guard: (
            event: { type: Events.second },
            context: GuardedStmContext
          ) => {
            return context.condition;
          },
        },
      },
    },
    [States.second]: {
      reactions: {
        [Events.simple]: this.toggleCondition,
      },
      transitions: {
        [Events.first]: [
          {
            target: States.first,
            guard: (
              event: { type: Events.first },
              context: GuardedStmContext
            ) => {
              return context.condition;
            },
          },
          {
            target: States.third,
            guard: (
              event: { type: Events.first },
              context: GuardedStmContext
            ) => {
              return !context.condition;
            },
          },
        ],
      },
    },
    [States.third]: {},
  };

  *toggleCondition() {
    yield* this.setContext({ condition: !this.condition });
  }

  get condition(): boolean {
    return this.context.condition;
  }
}

class GuardsTestStateMachine extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {
      transitions: {
        [Events.first]: {
          target: States.second,
          guard,
          command,
        },
      },
    },
    [States.second]: {},
    [States.third]: {},
  };
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('test STM with guards', () => {
  it('test that action matching guard triggers transition', () => {
    const guardedStm = new GuardedStateMachine();
    const reducers = combineReducers({
      [guardedStm.name]: guardedStm.stateReducer,
    });
    const sagaTester = new SagaTester<ReturnType<typeof reducers>>({
      reducers,
    });
    sagaTester.start(stateMachineStarterSaga, guardedStm);
    sagaTester.dispatch(guardedStm.start({ condition: false }));

    //At the end of the test first state machine should be in transitioned to state second
    //trigger transition with false condition
    expect(
      sagaTester.getState()[guardedStm.name].context!.condition
    ).toBeFalse();
    //change context dispatching simple event
    sagaTester.dispatch(simpleEvent());
    expect(
      sagaTester.getState()[guardedStm.name].context!.condition
    ).toBeTrue();
    //trigger transition
    sagaTester.dispatch(secondEvent());
    //check store state is changed
    expect(sagaTester.getState()[guardedStm.name].state).toEqual(States.second);
    sagaTester.dispatch(firstEvent());
    //check transition has been executed correctly
    expect(sagaTester.getState()[guardedStm.name].state).toEqual(States.first);
    //again transit to second state
    sagaTester.dispatch(secondEvent());
    //change context condition
    sagaTester.dispatch(simpleEvent());
    expect(
      sagaTester.getState()[guardedStm.name].context!.condition
    ).toBeFalse();
    //dispatch transition event
    sagaTester.dispatch(firstEvent());
    //check transition has been executed correctly
    expect(sagaTester.getState()[guardedStm.name].state).toEqual(States.third);
  });

  it("test that action that doesn't match guard is ignored", () => {
    const guardedStm = new GuardedStateMachine();
    const reducers = combineReducers({
      [guardedStm.name]: guardedStm.stateReducer,
    });
    const sagaTester = new SagaTester<ReturnType<typeof reducers>>({
      reducers,
    });
    sagaTester.start(stateMachineStarterSaga, guardedStm);
    sagaTester.dispatch(guardedStm.start({ condition: false }));
    //At the end of the test first state machine should be in transitioned to state second
    //trigger transition with false condition
    expect(
      sagaTester.getState()[guardedStm.name].context!.condition
    ).toBeFalse();
    sagaTester.dispatch(secondEvent());
    //check required transition has been ignored
    expect(sagaTester.getState()[guardedStm.name].state).toEqual(States.first);

    //change context dispatching simple event
    sagaTester.dispatch(simpleEvent());
    expect(
      sagaTester.getState()[guardedStm.name].context!.condition
    ).toBeTrue();
    //trigger transition
    sagaTester.dispatch(secondEvent());
    //check transition has been executed

    expect(commandSaga).toHaveBeenCalledTimes(1);
    //check store state is changed
    expect(sagaTester.getState()[guardedStm.name].state).toEqual(States.second);
  });

  it('tests that guards work correctly', async () => {
    const stm = new GuardsTestStateMachine();

    const reducers = combineReducers({
      [stm.name]: stm.stateReducer,
    });

    const tester = new SagaTester<ReturnType<typeof reducers>>({
      reducers,
    });

    tester.start(stateMachineStarterSaga, stm);
    tester.dispatch(stm.start({ condition: false }));

    expect(tester.getState()[stm.name].state).toEqual(States.first);

    guard.mockReturnValue(false);

    tester.dispatch({ type: Events.first });

    expect(guard).toHaveBeenCalled();
    expect(command).not.toHaveBeenCalled();

    expect(tester.getState()[stm.name].state).toEqual(States.first);

    jest.resetAllMocks();
    guard.mockReturnValue(true);

    tester.dispatch({ type: Events.first });

    expect(guard).toHaveBeenCalled();
    expect(command).toHaveBeenCalled();

    expect(tester.getState()[stm.name].state).toEqual(States.second);
  });
});

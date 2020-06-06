import { combineReducers } from 'redux';
import SagaTester from 'redux-saga-tester';
import { storeStmContextActionType } from '../../constants';
import { StateMachine } from '../running';
import { stateMachineStarterSaga } from '../startup';
import { Events, StateMachineNames, States } from './definitions.utils';
import { call, put } from 'redux-saga/effects';
import MockDate from 'mockdate';

interface Data {
  name: string;
  params: {
    first: string;
    second: number;
  };
}

interface Context {
  check?: boolean;
  data?: {
    lastRetrieved: number;
    values: Data[];
  };
}

const Api = {
  getData: jest.fn(),
  getSingleData: jest.fn(),
};

class ContextTest extends StateMachine<
  Events,
  States,
  StateMachineNames,
  Context
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {
      onEntry: this.sendContext,
      reactions: {
        [Events.first]: this.retrieveData,
        [Events.second]: this.updateElement,
      },
    },
    [States.second]: {},
    [States.third]: {},
  };

  *sendContext() {
    if (this.context.check) {
      yield put({ type: 'check_set' });
    }
  }

  *retrieveData() {
    const data = (yield call(Api.getData)) as Data[];
    if (
      !this.context.data ||
      this.context.data.lastRetrieved < Date.now() - 5 * 60 * 1000
    ) {
      yield* this.setContext({
        data: { lastRetrieved: Date.now(), values: data },
      });
    } else {
      yield* this.setContext(prevContext => {
        prevContext.data!.lastRetrieved = Date.now();
        prevContext.data!.values.push(...data);
      });
    }
  }

  *updateElement() {
    yield* this.setContext(prevContext => {
      prevContext.data!.values[prevContext.data!.values.length - 1].name =
        'new name';
    });
  }
}

it('tests that context is initialized and destroyed correctly', async () => {
  const stm = new ContextTest();
  const reducers = combineReducers({
    [stm.name]: stm.stateReducer,
  });
  const tester = new SagaTester<ReturnType<typeof reducers>>({ reducers });
  tester.start(stateMachineStarterSaga, stm);

  expect(tester.getState()[stm.name].context).toBeUndefined();

  tester.dispatch(stm.start({ check: true }));

  await tester.waitFor('check_set');

  expect(tester.getState()[stm.name].context).toEqual({ check: true });

  tester.dispatch(stm.stop());

  expect(tester.getState()[stm.name].context).toBeUndefined();

  tester.dispatch(stm.start({ check: false }));

  expect(tester.getState()[stm.name].context).toEqual({ check: false });

  expect(
    tester.getCalledActions().filter(a => a.type === 'check_set')
  ).toHaveLength(1);
});

it('tests that context is set while STM is active', async () => {
  const stm = new ContextTest();
  const reducers = combineReducers({
    [stm.name]: stm.stateReducer,
  });
  const tester = new SagaTester<ReturnType<typeof reducers>>({ reducers });
  tester.start(stateMachineStarterSaga, stm);

  expect(tester.getState()[stm.name].state).toBeNull();

  const data = [
    {
      name: 'abc',
      params: {
        first: 'def',
        second: 123,
      },
    },
    {
      name: 'abc',
      params: {
        first: 'def',
        second: 456,
      },
    },
  ];

  Api.getData.mockResolvedValue(data);
  MockDate.set('2011-09-22');

  tester.dispatch(stm.start({}));

  expect(tester.getState()[stm.name].state).toBe(States.first);
  expect(tester.getState()[stm.name].context).toEqual({});

  tester.dispatch({ type: Events.first });

  expect(Api.getData).toHaveBeenCalledTimes(1);

  await tester.waitFor(storeStmContextActionType);

  expect(tester.getState()[stm.name].context).toEqual({
    data: {
      lastRetrieved: new Date('2011-09-22').valueOf(),
      values: data,
    },
  });

  tester.dispatch({ type: Events.second });

  await tester.waitFor(storeStmContextActionType);

  expect(tester.getState()[stm.name].context!.data!.values[1].name).toEqual(
    'new name'
  );

  tester.dispatch({ type: Events.first });

  await tester.waitFor(storeStmContextActionType);

  const newData = [data[0], { ...data[1], name: 'new name' }, ...data];

  expect(tester.getState()[stm.name].context).toEqual({
    data: {
      lastRetrieved: new Date('2011-09-22').valueOf(),
      values: newData,
    },
  });
});

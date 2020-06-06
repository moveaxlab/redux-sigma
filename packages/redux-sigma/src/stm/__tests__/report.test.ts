import { combineReducers } from 'redux';
import SagaTester from 'redux-saga-tester';
import { StateMachine } from '../running';
import { Events, StateMachineNames, States } from './definitions.utils';
import { stateMachineStarterSaga } from '../startup';
import { startStmActionType } from '../../constants';

jest.mock('../startup/report', () => ({
  reportUnknownStateMachine: jest.fn(),
}));

const { reportUnknownStateMachine } = jest.requireMock('../startup/report');

class ReportTestStateMachine extends StateMachine<
  Events,
  States,
  StateMachineNames
> {
  protected readonly initialState = States.first;

  readonly name = StateMachineNames.base;

  protected readonly spec = {
    [States.first]: {},
    [States.second]: {},
    [States.third]: {},
  };
}

const oldEnv = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
  process.env = { ...oldEnv };
});

afterEach(() => {
  process.env = oldEnv;
});

test('tests that startup saga shows warning if STM name is unknown', () => {
  process.env.NODE_ENV = 'development';

  const stm = new ReportTestStateMachine();

  const reducer = combineReducers({
    [stm.name]: stm.stateReducer,
  });

  const tester = new SagaTester<ReturnType<typeof reducer>>({
    reducers: reducer,
  });

  tester.start(stateMachineStarterSaga, stm);

  tester.dispatch({
    type: startStmActionType,
    payload: { name: 'unknown_stm' },
  });

  expect(reportUnknownStateMachine).toHaveBeenCalledWith({
    type: startStmActionType,
    payload: { name: 'unknown_stm' },
  });
});

test('tests that startup saga shows no warning in production', () => {
  process.env.NODE_ENV = 'production';

  const stm = new ReportTestStateMachine();

  const reducer = combineReducers({
    [stm.name]: stm.stateReducer,
  });

  const tester = new SagaTester<ReturnType<typeof reducer>>({
    reducers: reducer,
  });

  tester.start(stateMachineStarterSaga, stm);

  tester.dispatch({
    type: startStmActionType,
    payload: { name: 'unknown_stm' },
  });

  expect(reportUnknownStateMachine).not.toHaveBeenCalled();
});

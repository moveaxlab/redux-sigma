import { StateMachine } from './stm/running';
import { stateMachineStarterSaga } from './stm/startup';
import { StateMachineSpec, StateMachineInterface } from './types';
import { FirstArgumentType } from './utils/typeInference';
import { not } from './utils/guards';
import { all, first, last } from './utils/policies';

export {
  StateMachine,
  StateMachineInterface,
  StateMachineSpec,
  stateMachineStarterSaga,
  FirstArgumentType,
  not,
  all,
  first,
  last,
};

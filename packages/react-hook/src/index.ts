import { StateMachineInterface } from 'redux-sigma';
import { useDispatch } from 'react-redux';
import useDeepCompareEffect from 'use-deep-compare-effect';

export function useStateMachine<SM extends string, C>(
  stm: StateMachineInterface<SM, C>,
  context: C
): void {
  const dispatch = useDispatch();

  useDeepCompareEffect(() => {
    dispatch(stm.start(context));

    return () => {
      dispatch(stm.stop());
    };
  }, [dispatch, stm, context]);
}

// import { combineReducers } from 'redux';
// import { StateMachine } from '../running';
// import { startStateMachine, stateMachineStarterSaga } from '../startup';
// import {
//   Events,
//   secondEvent,
//   simpleEvent,
//   StateMachineNames,
//   States,
// } from './definitions.utils';
//
// import SagaTester from 'redux-saga-tester';

test.todo('reenable tests here');

// export const entrySaga = jest.fn(() => {
//   console.log('entry');
// });
//
// type SimpleEventType = ReturnType<typeof simpleEvent>;
// type PayloadEventType = ReturnType<typeof payloadEvent>;

// CONSTANTS

// const SRU_DELAY = 20;
// const SRU = 'SECOND_REACTION_UUID';
//
// TYPES
// type SECOND_REACTION_UUID = 'SECOND_REACTION_UUID';
// interface SRUuid {
//   type: SECOND_REACTION_UUID;
//   id: string;
// }

//UTILS

// function pluck<T, K extends keyof T>(o: T, propertyNames: K[]): Partial<T> {
//   const r = {};
//   for (const key of propertyNames) {
//     Object.assign(r, { [key]: o[key] });
//   }
//   return r;
// }
//
// TEST STM DEFINITION

// const dBaseTestSTMSpec = {};

// class ReactionTestStateMachine extends StateMachine<
//   Events,
//   States,
//   StateMachineNames
// > {
//   readonly name = StateMachineNames.reactionTest;
//
//   protected context = {};
//
//   protected readonly initialContext = {};
//
//   protected readonly initialState = States.first;
//
//   protected readonly spec = {
//     [States.first]: {
//       reactions: {
//         [Events.secondReaction]: this.secondReactionSaga,
//       },
//     },
//     [States.second]: {},
//     [States.third]: {},
//   };
//
//   *secondReactionSaga(event: SecondReactionEvent) {
//     yield delay(SRU_DELAY);
//     yield put({ type: SRU, id: event.id });
//   }
// }

//******* SECOND SUITE

// describe('STM TRANSITIONS', () => {
//   const eventFirst = { type: Events.first };
//
//   it('STM BASE', () => {
//     //At the end of the test first state machine should be in transitioned to state second
//     const expectedStoreState = {
//       [StateMachineNames.first]: States.second,
//     };
//     jest.clearAllMocks();
//     firstStm = new FirstStateMachine();
//     sagaTester.dispatch(startFirstSTMEvent);
//     expect(entrySaga).toHaveBeenCalledTimes(1);
//     sagaTester.dispatch(eventFirst);
//     expect(exitSaga).toHaveBeenCalledTimes(1);
//     const state = pluck(
//       sagaTester.getState(),
//       Object.keys(expectedStoreState)
//     );
//     expect(state).toEqual(expectedStoreState);
//   });
// });
//
// describe('STM RUNNING BEHAVIOUR', () => {
//   const eventFirst = { type: Events.first };
//   beforeEach(() => {
//     sagaTester.dispatch(startFirstSTMEvent);
//     jest.clearAllMocks();
//   });
//
//   it('STM TEST TRANSITION', () => {
//     //At the end of the test first state machine should be in transitioned to state second
//     const expectedStoreState = {
//       [StateMachineNames.first]: States.second,
//     };
//     sagaTester.dispatch(eventFirst);
//     sagaTester.waitFor(storeStmStateActionType);
//     expect(entrySaga).not.toHaveBeenCalled();
//     expect(exitSaga).toHaveBeenCalledTimes(1);
//     const state = pluck(
//       sagaTester.getState(),
//       Object.keys(expectedStoreState)
//     );
//     expect(state).toEqual(expectedStoreState);
//   });
//
//   describe('STM REACTION', () => {
//     const eventFirstReaction = { type: Events.firstReaction };
//     beforeEach(() => {
//       sagaTester.dispatch(startFirstSTMEvent);
//     });
//     it('RESPONDS', () => {
//       sagaTester.dispatch(eventFirstReaction);
//       expect(entrySaga).not.toHaveBeenCalled();
//       expect(exitSaga).not.toHaveBeenCalled();
//       expect(someSaga).not.toHaveBeenCalled();
//       expect(reactionSaga).toHaveBeenCalledTimes(1);
//       expect(someOtherSaga).not.toHaveBeenCalled();
//     });
//
//     it('DIES AT TRANSITION', () => {
//       sagaTester.dispatch(eventFirstReaction);
//       expect(reactionSaga).toHaveBeenCalledTimes(1);
//       sagaTester.dispatch(eventFirstReaction);
//       expect(reactionSaga).toHaveBeenCalledTimes(2);
//       //change state machine state to second
//       sagaTester.dispatch(eventFirst);
//       sagaTester.dispatch(eventFirstReaction);
//       expect(reactionSaga).toHaveBeenCalledTimes(2);
//     });
//
//   describe('STM GUARDS', () => {});
// });

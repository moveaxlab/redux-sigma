"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var immer_1 = __importDefault(require("immer"));
var effects_1 = require("redux-saga/effects");
var constants_1 = require("../constants");
var typeGuards_1 = require("../utils/typeGuards");
/**
 * STM saga
 */
var StateMachine = /** @class */ (function () {
    function StateMachine() {
        var _this = this;
        this.runningTasks = [];
        this.start = function (context) {
            return {
                type: constants_1.startStmActionType,
                payload: {
                    name: _this.name,
                    context: context,
                },
            };
        };
        this.stop = function () {
            return {
                type: constants_1.stopStmActionType,
                payload: {
                    name: _this.name,
                },
            };
        };
        this.storeState = function (state) {
            return {
                type: constants_1.storeStmStateActionType,
                payload: {
                    name: _this.name,
                    state: state,
                },
            };
        };
        this.storeContext = function (context) {
            return {
                type: constants_1.storeStmContextActionType,
                payload: {
                    name: _this.name,
                    context: context,
                },
            };
        };
        /**
         * This reducer stores the current state of the State Machine. It can be
         * added to your application reducers if you need to access the state of a
         * State Machine somewhere in your application.
         *
         * @param state  The current state (`null` if not running).
         * @param action The action taken by the reducer.
         */
        this.stateReducer = function (state, action) {
            if (state === void 0) { state = { state: null, context: undefined }; }
            if (!action.payload ||
                !action.payload.name ||
                action.payload.name !== _this.name) {
                return state;
            }
            switch (action.type) {
                case constants_1.startStmActionType:
                    if (!typeGuards_1.isStarted(state)) {
                        return {
                            state: _this.initialState,
                            context: action.payload.context,
                        };
                    }
                    else {
                        return state;
                    }
                case constants_1.stopStmActionType:
                    return {
                        state: null,
                        context: undefined,
                    };
                case constants_1.storeStmContextActionType:
                    if (!typeGuards_1.isStarted(state)) {
                        return state;
                    }
                    else {
                        return {
                            state: state.state,
                            context: action.payload.context,
                        };
                    }
                case constants_1.storeStmStateActionType:
                    if (typeGuards_1.isStarted(state)) {
                        return {
                            state: action.payload.state,
                            context: state.context,
                        };
                    }
                    else {
                        return state;
                    }
            }
        };
    }
    StateMachine.prototype.setContext = function (newContext) {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (typeGuards_1.isFunction(newContext)) {
                        this._context = immer_1.default(this._context, newContext);
                    }
                    else {
                        this._context = newContext;
                    }
                    return [4 /*yield*/, effects_1.putResolve(this.storeContext(this._context))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    };
    Object.defineProperty(StateMachine.prototype, "context", {
        get: function () {
            return this._context;
        },
        enumerable: true,
        configurable: true
    });
    StateMachine.prototype.starterSaga = function () {
        var action, task;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, effects_1.take(function (action) {
                            return action.type === constants_1.startStmActionType &&
                                action.payload &&
                                action.payload.name === _this.name;
                        })];
                case 1:
                    action = (_a.sent());
                    return [4 /*yield*/, effects_1.fork([this, this.run], action.payload.context)];
                case 2:
                    task = (_a.sent());
                    return [4 /*yield*/, effects_1.take(function (action) {
                            return action.type === constants_1.stopStmActionType &&
                                action.payload &&
                                action.payload.name === _this.name;
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, effects_1.cancel(task)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 5: return [2 /*return*/];
            }
        });
    };
    /**
     * Runs the State Machine described by the spec. To stop the State
     * machine, cancel the task. Or, better still, rely on the
     * `stateMachineStarterSaga` utility function.
     */
    StateMachine.prototype.run = function (context) {
        var nextState, transitions, transitionEvents, _a, _b, _c, _d, _e, _i, _f, saga;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    this._context = context;
                    this.currentState = this.initialState;
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, , 23, 25]);
                    _g.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 22];
                    nextState = {};
                    _g.label = 3;
                case 3:
                    _g.trys.push([3, , 11, 13]);
                    transitions = this.spec[this.currentState].transitions;
                    transitionEvents = transitions
                        ? Object.keys(transitions)
                        : [];
                    _a = this;
                    return [4 /*yield*/, effects_1.actionChannel(transitionEvents)];
                case 4:
                    _a.transitionChannel = (_g.sent());
                    _c = (_b = this.runningTasks).push;
                    return [4 /*yield*/, effects_1.fork([this, this.startOnEntryActivities])];
                case 5:
                    _c.apply(_b, [(_g.sent())]);
                    _e = (_d = this.runningTasks).push;
                    return [4 /*yield*/, effects_1.fork([this, this.registerToReactions])];
                case 6:
                    _e.apply(_d, [(_g.sent())]);
                    return [4 /*yield*/, effects_1.call([this, this.startSubMachines])];
                case 7:
                    _g.sent();
                    return [4 /*yield*/, effects_1.call([this, this.getNextState])];
                case 8:
                    nextState = (_g.sent());
                    return [4 /*yield*/, effects_1.call([this, this.cancelRunningTasks])];
                case 9:
                    _g.sent();
                    return [4 /*yield*/, effects_1.call([this, this.stopSubMachines])];
                case 10:
                    _g.sent();
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, effects_1.call([this, this.runOnExitActivities])];
                case 12:
                    _g.sent();
                    return [7 /*endfinally*/];
                case 13:
                    if (!nextState.command) return [3 /*break*/, 20];
                    if (!typeGuards_1.isArray(nextState.command)) return [3 /*break*/, 18];
                    _i = 0, _f = nextState.command;
                    _g.label = 14;
                case 14:
                    if (!(_i < _f.length)) return [3 /*break*/, 17];
                    saga = _f[_i];
                    return [4 /*yield*/, effects_1.call([this, saga], nextState.event)];
                case 15:
                    _g.sent();
                    _g.label = 16;
                case 16:
                    _i++;
                    return [3 /*break*/, 14];
                case 17: return [3 /*break*/, 20];
                case 18: return [4 /*yield*/, effects_1.call([this, nextState.command], nextState.event)];
                case 19:
                    _g.sent();
                    _g.label = 20;
                case 20:
                    this.currentState = nextState.nextState;
                    return [4 /*yield*/, effects_1.put(this.storeState(this.currentState))];
                case 21:
                    _g.sent();
                    return [3 /*break*/, 2];
                case 22: return [3 /*break*/, 25];
                case 23: return [4 /*yield*/, effects_1.call([this, this.stopSubMachines])];
                case 24:
                    _g.sent();
                    this.cancelRunningTasks();
                    return [7 /*endfinally*/];
                case 25: return [2 /*return*/];
            }
        });
    };
    /**
     * Waits for the first event matching a regular transition or a guarded
     * transition, and returns it together with the next state and the
     * optional command that must be executed before transitioning.
     */
    StateMachine.prototype.getNextState = function () {
        var event_1, transitionSpec, _i, _a, transitionOption;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!true) return [3 /*break*/, 10];
                    return [4 /*yield*/, effects_1.take(this.transitionChannel)];
                case 1:
                    event_1 = (_b.sent());
                    transitionSpec = this.spec[this.currentState].transitions[event_1.type];
                    if (!typeGuards_1.isStateTransition(transitionSpec)) return [3 /*break*/, 2];
                    return [2 /*return*/, {
                            event: event_1,
                            nextState: transitionSpec,
                        }];
                case 2:
                    if (!typeGuards_1.isSimpleTransition(transitionSpec)) return [3 /*break*/, 3];
                    return [2 /*return*/, {
                            event: event_1,
                            nextState: transitionSpec.target,
                            command: transitionSpec.command,
                        }];
                case 3:
                    if (!typeGuards_1.isGuardedTransition(transitionSpec)) return [3 /*break*/, 5];
                    return [4 /*yield*/, effects_1.call(transitionSpec.guard, event_1, this.context)];
                case 4:
                    if (_b.sent()) {
                        return [2 /*return*/, {
                                event: event_1,
                                nextState: transitionSpec.target,
                                command: transitionSpec.command,
                            }];
                    }
                    return [3 /*break*/, 9];
                case 5:
                    if (!typeGuards_1.isGuardedTransitionArray(transitionSpec)) return [3 /*break*/, 9];
                    _i = 0, _a = transitionSpec;
                    _b.label = 6;
                case 6:
                    if (!(_i < _a.length)) return [3 /*break*/, 9];
                    transitionOption = _a[_i];
                    return [4 /*yield*/, effects_1.call(transitionOption.guard, event_1, this.context)];
                case 7:
                    if (_b.sent())
                        return [2 /*return*/, {
                                event: event_1,
                                nextState: transitionOption.target,
                                command: transitionOption.command,
                            }];
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9: return [3 /*break*/, 0];
                case 10: return [2 /*return*/];
            }
        });
    };
    /**
     * Starts all onEntry activities. Does not wait for them to complete.
     */
    StateMachine.prototype.startOnEntryActivities = function () {
        var onEntry, _i, onEntry_1, saga, _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    onEntry = this.spec[this.currentState].onEntry;
                    if (!onEntry) return [3 /*break*/, 7];
                    if (!typeGuards_1.isArray(onEntry)) return [3 /*break*/, 5];
                    _i = 0, onEntry_1 = onEntry;
                    _e.label = 1;
                case 1:
                    if (!(_i < onEntry_1.length)) return [3 /*break*/, 4];
                    saga = onEntry_1[_i];
                    _b = (_a = this.runningTasks).push;
                    return [4 /*yield*/, effects_1.fork([this, saga])];
                case 2:
                    _b.apply(_a, [(_e.sent())]);
                    _e.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 7];
                case 5:
                    _d = (_c = this.runningTasks).push;
                    return [4 /*yield*/, effects_1.fork([this, onEntry])];
                case 6:
                    _d.apply(_c, [(_e.sent())]);
                    _e.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    };
    /**
     * Starts and add the background task listening to reactions
     * in the background task list
     */
    StateMachine.prototype.registerToReactions = function () {
        var reactions, eventTypes, _i, eventTypes_1, e, r, activity, policy, task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reactions = this.spec[this.currentState].reactions;
                    if (!reactions) return [3 /*break*/, 9];
                    eventTypes = Object.keys(reactions);
                    _i = 0, eventTypes_1 = eventTypes;
                    _a.label = 1;
                case 1:
                    if (!(_i < eventTypes_1.length)) return [3 /*break*/, 9];
                    e = eventTypes_1[_i];
                    r = reactions[e];
                    activity = void 0;
                    policy = void 0;
                    if (typeGuards_1.isReactionSpec(r)) {
                        activity = r.activity;
                        policy = r.policy;
                    }
                    else {
                        activity = r;
                        policy = constants_1.REACTION_POLICY_ALL;
                    }
                    task = void 0;
                    if (!(policy === constants_1.REACTION_POLICY_LAST)) return [3 /*break*/, 3];
                    return [4 /*yield*/, effects_1.fork({
                            context: this,
                            fn: this.takeLast,
                        }, e, activity)];
                case 2:
                    task = (_a.sent());
                    return [3 /*break*/, 7];
                case 3:
                    if (!(policy === constants_1.REACTION_POLICY_FIRST)) return [3 /*break*/, 5];
                    return [4 /*yield*/, effects_1.fork({
                            context: this,
                            fn: this.takeFirst,
                        }, e, activity)];
                case 4:
                    task = (_a.sent());
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, effects_1.fork({
                        context: this,
                        fn: this.takeAll,
                    }, e, activity)];
                case 6:
                    task = (_a.sent());
                    _a.label = 7;
                case 7:
                    //enqueue task
                    this.runningTasks.push(task);
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/];
            }
        });
    };
    //Reactions Policies
    /**
     * takes the first available event and process it. When done take the next emitted event of the same kind until task is cancelled
     * @param e: the event we are waiting for
     * @param activity: the activity to be executed once the event is received
     */
    StateMachine.prototype.takeFirst = function (e, activity) {
        var event_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 3];
                    return [4 /*yield*/, effects_1.take(e)];
                case 1:
                    event_2 = (_a.sent());
                    return [4 /*yield*/, effects_1.call([this, activity], event_2)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 3: return [2 /*return*/];
            }
        });
    };
    /**
     * takes every event e emitted and launches the activity with it.
     * if another event e is emitted during activity execution
     * previous processing is cancelled and a new one with the new event starts
     * @param e: the event we are waiting for
     * @param activity the activity to be executed once the event is received
     */
    StateMachine.prototype.takeLast = function (e, activity) {
        var channel, task, event_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, effects_1.actionChannel(e)];
                case 1:
                    channel = (_a.sent());
                    task = null;
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, effects_1.take(channel)];
                case 3:
                    event_3 = (_a.sent());
                    if (!(task !== null)) return [3 /*break*/, 5];
                    return [4 /*yield*/, effects_1.cancel(task)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [4 /*yield*/, effects_1.fork([this, activity], event_3)];
                case 6:
                    task = (_a.sent());
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/];
            }
        });
    };
    /**
     * takes all event emitted one at time and sequentially launches activity
     * @param e: the event we are waiting for
     * @param activity the activity to be executed once the event is received
     */
    StateMachine.prototype.takeAll = function (e, activity) {
        var channel, event_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, effects_1.actionChannel(e)];
                case 1:
                    channel = (_a.sent());
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, effects_1.take(channel)];
                case 3:
                    event_4 = (_a.sent());
                    return [4 /*yield*/, effects_1.call([this, activity], event_4)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    };
    /**
     * Stops all running tasks. Used when exiting from a state or when the STM
     * is cancelled.
     */
    StateMachine.prototype.cancelRunningTasks = function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, effects_1.cancel(this.runningTasks)];
                case 1:
                    _a.sent();
                    this.runningTasks = [];
                    return [2 /*return*/];
            }
        });
    };
    /**
     * Starts all STMs.
     */
    StateMachine.prototype.startSubMachines = function () {
        var subMachines, _i, subMachines_1, subMachine;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    subMachines = this.spec[this.currentState].subMachines;
                    if (!subMachines)
                        return [2 /*return*/];
                    if (!typeGuards_1.isArray(subMachines)) {
                        subMachines = [subMachines];
                    }
                    _i = 0, subMachines_1 = subMachines;
                    _a.label = 1;
                case 1:
                    if (!(_i < subMachines_1.length)) return [3 /*break*/, 4];
                    subMachine = subMachines_1[_i];
                    return [4 /*yield*/, effects_1.put(subMachine.start({}))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    };
    /**
     * Stops all sub STMs.
     */
    StateMachine.prototype.stopSubMachines = function () {
        var subMachines, _i, subMachines_2, subMachine;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    subMachines = this.spec[this.currentState].subMachines;
                    if (!subMachines)
                        return [2 /*return*/];
                    if (!typeGuards_1.isArray(subMachines)) {
                        subMachines = [subMachines];
                    }
                    _i = 0, subMachines_2 = subMachines;
                    _a.label = 1;
                case 1:
                    if (!(_i < subMachines_2.length)) return [3 /*break*/, 4];
                    subMachine = subMachines_2[_i];
                    return [4 /*yield*/, effects_1.put(subMachine.stop())];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    };
    /**
     * Runs all onExit activities, and waits for them to return before continuing.
     */
    StateMachine.prototype.runOnExitActivities = function () {
        var onExit, _i, onExit_1, saga;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    onExit = this.spec[this.currentState].onExit;
                    if (!onExit) return [3 /*break*/, 7];
                    if (!typeGuards_1.isArray(onExit)) return [3 /*break*/, 5];
                    _i = 0, onExit_1 = onExit;
                    _a.label = 1;
                case 1:
                    if (!(_i < onExit_1.length)) return [3 /*break*/, 4];
                    saga = onExit_1[_i];
                    return [4 /*yield*/, effects_1.call([this, saga])];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, effects_1.call([this, onExit])];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    };
    return StateMachine;
}());
exports.StateMachine = StateMachine;

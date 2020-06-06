"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
var effects_1 = require("redux-saga/effects");
var constants_1 = require("../../constants");
var report_1 = require("./report");
var DuplicateStateMachineError = /** @class */ (function (_super) {
    __extends(DuplicateStateMachineError, _super);
    function DuplicateStateMachineError(stmName) {
        var _this = _super.call(this, "Duplicate STM detected with name " + stmName) || this;
        _this.constructor = DuplicateStateMachineError;
        Object.setPrototypeOf(_this, DuplicateStateMachineError.prototype);
        return _this;
    }
    return DuplicateStateMachineError;
}(Error));
exports.DuplicateStateMachineError = DuplicateStateMachineError;
/**
 * Creates a saga that starts and stops STMs in response to
 * startStateMachine and stopStateMachine actions dispatched to redux. A STM
 * cannot be started more than once.
 * @param stms - An array of StateMachine instances.
 */
function stateMachineStarterSaga() {
    var _i, dupeStm, _a, stms_1, stm, stmNames_1;
    var stms = [];
    for (_i = 0; _i < arguments.length; _i++) {
        stms[_i] = arguments[_i];
    }
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                dupeStm = stms
                    .map(function (stm) { return stm.name; })
                    .find(function (name, idx, arr) { return arr.lastIndexOf(name) !== idx; });
                if (dupeStm) {
                    throw new DuplicateStateMachineError(dupeStm);
                }
                _a = 0, stms_1 = stms;
                _b.label = 1;
            case 1:
                if (!(_a < stms_1.length)) return [3 /*break*/, 4];
                stm = stms_1[_a];
                return [4 /*yield*/, effects_1.fork([stm, stm.starterSaga])];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                _a++;
                return [3 /*break*/, 1];
            case 4:
                if (!(process.env.NODE_ENV !== 'production')) return [3 /*break*/, 6];
                stmNames_1 = stms.map(function (stm) { return stm.name; });
                return [4 /*yield*/, effects_1.takeEvery(function (action) {
                        return action.payload &&
                            action.payload.name &&
                            [
                                constants_1.startStmActionType,
                                constants_1.stopStmActionType,
                                constants_1.storeStmContextActionType,
                                constants_1.storeStmStateActionType,
                            ].includes(action.type) &&
                            !stmNames_1.includes(action.payload.name);
                    }, report_1.reportUnknownStateMachine)];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}
exports.stateMachineStarterSaga = stateMachineStarterSaga;

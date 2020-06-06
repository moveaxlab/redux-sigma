"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isArray(elem) {
    return elem instanceof Array;
}
exports.isArray = isArray;
function isStateTransition(value) {
    return typeof value === 'string';
}
exports.isStateTransition = isStateTransition;
function isGuardedTransition(value) {
    return 'guard' in value;
}
exports.isGuardedTransition = isGuardedTransition;
function isGuardedTransitionArray(value) {
    return value instanceof Array;
}
exports.isGuardedTransitionArray = isGuardedTransitionArray;
function isSimpleTransition(value) {
    return (!isStateTransition(value) &&
        !isGuardedTransition(value) &&
        !isGuardedTransitionArray(value));
}
exports.isSimpleTransition = isSimpleTransition;
function isReactionSpec(value) {
    return 'policy' in value;
}
exports.isReactionSpec = isReactionSpec;
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;
function isStarted(storage) {
    return storage.state !== null;
}
exports.isStarted = isStarted;

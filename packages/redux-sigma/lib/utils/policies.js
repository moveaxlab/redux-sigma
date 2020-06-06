"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("../constants");
function all(activity) {
    return {
        activity: activity,
        policy: constants_1.REACTION_POLICY_ALL,
    };
}
exports.all = all;
function last(activity) {
    return {
        activity: activity,
        policy: constants_1.REACTION_POLICY_LAST,
    };
}
exports.last = last;
function first(activity) {
    return {
        activity: activity,
        policy: constants_1.REACTION_POLICY_FIRST,
    };
}
exports.first = first;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function not(f) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return !f.apply(void 0, args);
    };
}
exports.not = not;

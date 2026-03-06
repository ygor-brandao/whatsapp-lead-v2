"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    code;
    context;
    constructor(code, message, context) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;

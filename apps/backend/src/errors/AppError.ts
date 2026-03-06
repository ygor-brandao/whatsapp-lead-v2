import { ErrorCode } from './error-codes';

export class AppError extends Error {
    public code: ErrorCode;
    public context?: Record<string, unknown>;

    constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
}

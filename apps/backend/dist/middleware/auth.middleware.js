"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const AppError_1 = require("../errors/AppError");
const error_codes_1 = require("../errors/error-codes");
const env_1 = require("../config/env");
async function authMiddleware(request, reply) {
    // Evolution API sends webhook events.
    // We can validate utilizing basic headers or a specific secret path
    // Custom secret header can be used, e.g., 'x-webhook-secret' or simply via query string.
    const authHeader = request.headers['authorization'] || request.headers['x-webhook-secret'];
    if (authHeader !== env_1.env.WEBHOOK_SECRET) {
        throw new AppError_1.AppError(error_codes_1.ERROR_CODES.WEBHOOK_INVALID_SECRET, 'Invalid webhook secret');
    }
}

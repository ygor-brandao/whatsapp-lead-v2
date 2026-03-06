"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = globalErrorHandler;
const AppError_1 = require("./AppError");
const logger_1 = require("../lib/logger");
const env_1 = require("../config/env");
async function globalErrorHandler(error, request, reply) {
    const isApp = error instanceof AppError_1.AppError;
    const statusCode = error.statusCode ?? 500;
    // Log SEMPRE com contexto completo — nunca engolir um erro silenciosamente
    logger_1.logger.error({
        module: 'error-handler',
        errorCode: isApp ? error.code : 'UNHANDLED',
        errorName: error.name,
        message: error.message,
        stack: error.stack,
        context: isApp ? error.context : undefined,
        request: {
            url: request.url,
            method: request.method,
            body: request.body,
        },
    });
    // Resposta ao cliente: nunca vazar stack trace em produção
    reply.status(statusCode).send({
        error: {
            code: isApp ? error.code : 'INTERNAL_ERROR',
            message: statusCode < 500 ? error.message : 'Erro interno do servidor',
            ...(env_1.env.NODE_ENV === 'development' && {
                debug: {
                    stack: error.stack,
                    context: isApp ? error.context : undefined,
                },
            }),
        },
    });
}

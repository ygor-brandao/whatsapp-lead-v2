import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './AppError';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export async function globalErrorHandler(
    error: Error | AppError | FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const isApp = error instanceof AppError;
    const statusCode = (error as FastifyError).statusCode ?? 500;

    // Log SEMPRE com contexto completo — nunca engolir um erro silenciosamente
    logger.error({
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
            ...(true && { // Temporarily show in production to debug backend-db connection
                debug: {
                    stack: error.stack,
                    context: isApp ? error.context : undefined,
                },
            }),
        },
    });
}

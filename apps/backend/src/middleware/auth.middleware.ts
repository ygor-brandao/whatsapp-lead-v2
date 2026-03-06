import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/AppError';
import { ERROR_CODES } from '../errors/error-codes';
import { env } from '../config/env';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    // Evolution API sends webhook events.
    // We can validate utilizing basic headers or a specific secret path
    // Custom secret header can be used, e.g., 'x-webhook-secret' or simply via query string.

    const authHeader = request.headers['authorization'] || request.headers['x-webhook-secret'];

    if (authHeader !== env.WEBHOOK_SECRET) {
        throw new AppError(
            ERROR_CODES.WEBHOOK_INVALID_SECRET,
            'Invalid webhook secret'
        );
    }
}

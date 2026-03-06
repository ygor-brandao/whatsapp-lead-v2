import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

redis.on('error', (error) => {
    logger.error({
        module: 'redis',
        operation: 'connection',
        error: error.message,
        stack: error.stack
    });
});

redis.on('ready', () => {
    logger.info({
        module: 'redis',
        operation: 'ready',
        message: 'Redis connection successful'
    });
});

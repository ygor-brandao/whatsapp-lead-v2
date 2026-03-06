import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export const MESSAGE_QUEUE_NAME = 'message-queue';

export const messageQueue = new Queue<{
    messageId: string;
    groupId: string;
    message: string;
    senderNumber: string;
    timestamp: number;
}>(MESSAGE_QUEUE_NAME, {
    connection: redis as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});

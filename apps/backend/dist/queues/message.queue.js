"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageQueue = exports.MESSAGE_QUEUE_NAME = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../lib/redis");
exports.MESSAGE_QUEUE_NAME = 'message-queue';
exports.messageQueue = new bullmq_1.Queue(exports.MESSAGE_QUEUE_NAME, {
    connection: redis_1.redis,
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

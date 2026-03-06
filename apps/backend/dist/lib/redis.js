"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
exports.redis.on('error', (error) => {
    logger_1.logger.error({
        module: 'redis',
        operation: 'connection',
        error: error.message,
        stack: error.stack
    });
});
exports.redis.on('ready', () => {
    logger_1.logger.info({
        module: 'redis',
        operation: 'ready',
        message: 'Redis connection successful'
    });
});

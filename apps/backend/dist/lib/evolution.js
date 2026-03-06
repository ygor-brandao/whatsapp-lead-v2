"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolutionClient = exports.EvolutionClient = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
const constants_1 = require("../config/constants");
const AppError_1 = require("../errors/AppError");
const error_codes_1 = require("../errors/error-codes");
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
class EvolutionClient {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: env_1.env.EVOLUTION_API_URL,
            headers: {
                'apikey': env_1.env.EVOLUTION_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    }
    async findMessages(groupId, options) {
        return this.withRetry(async () => {
            const response = await this.client.post(`/chat/findMessages/${env_1.env.EVOLUTION_INSTANCE_NAME}`, {
                remoteJid: groupId,
                ...options
            });
            return response.data;
        }, 'findMessages');
    }
    async sendText(remoteJid, text) {
        return this.withRetry(async () => {
            const response = await this.client.post(`/message/sendText/${env_1.env.EVOLUTION_INSTANCE_NAME}`, {
                number: remoteJid,
                text
            });
            return response.data;
        }, 'sendText');
    }
    async reconnect() {
        return this.withRetry(async () => {
            const response = await this.client.get(`/instance/connectionState/${env_1.env.EVOLUTION_INSTANCE_NAME}`);
            if (response.data && response.data.state !== 'open') {
                logger_1.logger.info({ module: 'evolution', operation: 'reconnect', message: 'Instance not open, attempting restart if necessary' });
                // Optionally connect here
                await this.client.put(`/instance/connect/${env_1.env.EVOLUTION_INSTANCE_NAME}`);
            }
            return response.data;
        }, 'reconnect');
    }
    async withRetry(fn, operation) {
        let lastError = null;
        for (let attempt = 0; attempt < constants_1.CONSTANTS.MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    logger_1.logger.warn({ module: 'evolution-client', operation: 'retry', attempt, maxRetries: constants_1.CONSTANTS.MAX_RETRIES });
                    await delay(constants_1.CONSTANTS.RETRY_DELAYS_MS[attempt - 1] ?? 5000);
                }
                return await fn();
            }
            catch (error) {
                lastError = error;
                logger_1.logger.error({
                    module: 'evolution',
                    operation,
                    attempt: attempt + 1,
                    error: error.message,
                    stack: error.stack
                });
            }
        }
        throw new AppError_1.AppError(error_codes_1.ERROR_CODES.EVOLUTION_CONNECTION_FAILED, `Failed to execute evolution operation ${operation} after ${constants_1.CONSTANTS.MAX_RETRIES} attempts`, { error: lastError?.message });
    }
}
exports.EvolutionClient = EvolutionClient;
exports.evolutionClient = new EvolutionClient();

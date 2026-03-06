import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from './logger';
import { CONSTANTS } from '../config/constants';
import { AppError } from '../errors/AppError';
import { ERROR_CODES } from '../errors/error-codes';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class EvolutionClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: env.EVOLUTION_API_URL,
            headers: {
                'apikey': env.EVOLUTION_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    }

    async findMessages(groupId: string, options: { skip?: number, limit?: number, where?: any }) {
        return this.withRetry(async () => {
            const response = await this.client.post(`/chat/findMessages/${env.EVOLUTION_INSTANCE_NAME}`, {
                remoteJid: groupId,
                ...options
            });
            return response.data;
        }, 'findMessages');
    }

    async sendText(remoteJid: string, text: string) {
        return this.withRetry(async () => {
            const response = await this.client.post(`/message/sendText/${env.EVOLUTION_INSTANCE_NAME}`, {
                number: remoteJid,
                text
            });
            return response.data;
        }, 'sendText');
    }

    async reconnect() {
        return this.withRetry(async () => {
            const response = await this.client.get(`/instance/connectionState/${env.EVOLUTION_INSTANCE_NAME}`);
            if (response.data && response.data.state !== 'open') {
                logger.info({ module: 'evolution', operation: 'reconnect', message: 'Instance not open, attempting restart if necessary' });
                // Optionally connect here
                await this.client.put(`/instance/connect/${env.EVOLUTION_INSTANCE_NAME}`);
            }
            return response.data;
        }, 'reconnect');
    }

    private async withRetry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
        let lastError: any = null;
        for (let attempt = 0; attempt < CONSTANTS.MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    logger.warn({ module: 'evolution-client', operation: 'retry', attempt, maxRetries: CONSTANTS.MAX_RETRIES });
                    await delay(CONSTANTS.RETRY_DELAYS_MS[attempt - 1] ?? 5000);
                }
                return await fn();
            } catch (error: any) {
                lastError = error;
                logger.error({
                    module: 'evolution',
                    operation,
                    attempt: attempt + 1,
                    error: error.message,
                    stack: error.stack
                });
            }
        }

        throw new AppError(
            ERROR_CODES.EVOLUTION_CONNECTION_FAILED,
            `Failed to execute evolution operation ${operation} after ${CONSTANTS.MAX_RETRIES} attempts`,
            { error: lastError?.message }
        );
    }
}

export const evolutionClient = new EvolutionClient();

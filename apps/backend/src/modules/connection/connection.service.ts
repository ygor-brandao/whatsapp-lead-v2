import { logger } from '../../lib/logger';
import { evolutionClient } from '../../lib/evolution';
import { prisma } from '../../lib/prisma';

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 30_000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ConnectionService {
    private retryCount = 0;
    private reconnecting = false;

    async handleDisconnect(reason: string): Promise<void> {
        logger.warn({ module: 'connection', operation: 'disconnect', reason });

        if (this.reconnecting) return;
        this.reconnecting = true;

        for (this.retryCount = 1; this.retryCount <= MAX_RECONNECT_ATTEMPTS; this.retryCount++) {
            logger.info({
                module: 'connection',
                operation: 'reconnect-attempt',
                attempt: `${this.retryCount}/${MAX_RECONNECT_ATTEMPTS}`
            });

            try {
                await delay(RECONNECT_DELAY_MS);
                await evolutionClient.reconnect();

                await this.updateStatus('CONNECTED');
                logger.info({ module: 'connection', operation: 'reconnect-success' });
                this.retryCount = 0;
                this.reconnecting = false;
                return;

            } catch (err: any) {
                logger.error({
                    module: 'connection',
                    operation: 'reconnect-failed',
                    attempt: this.retryCount,
                    error: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined
                });
                await this.updateStatus('RECONNECTING', this.retryCount);
            }
        }

        // Todas as tentativas falharam
        this.reconnecting = false;
        await this.updateStatus('DISCONNECTED', MAX_RECONNECT_ATTEMPTS);

        logger.error({
            module: 'connection',
            operation: 'reconnect-exhausted',
            message: `Falhou ${MAX_RECONNECT_ATTEMPTS} vezes. Intervenção manual necessária.`,
            reason
        });
    }

    private async updateStatus(status: string, retries = 0) {
        try {
            await prisma.connectionStatus.upsert({
                where: { id: 'singleton' },
                create: { id: 'singleton', status, retryCount: retries, lastSeen: new Date() },
                update: { status, retryCount: retries, lastSeen: new Date() }
            });
        } catch (e: any) {
            logger.error({ module: 'connection', operation: 'db-update-failed', error: e.message });
        }
    }
}

export const connectionService = new ConnectionService();

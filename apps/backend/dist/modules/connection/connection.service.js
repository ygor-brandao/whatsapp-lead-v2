"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionService = exports.ConnectionService = void 0;
const logger_1 = require("../../lib/logger");
const evolution_1 = require("../../lib/evolution");
const prisma_1 = require("../../lib/prisma");
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 30_000;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
class ConnectionService {
    retryCount = 0;
    reconnecting = false;
    async handleDisconnect(reason) {
        logger_1.logger.warn({ module: 'connection', operation: 'disconnect', reason });
        if (this.reconnecting)
            return;
        this.reconnecting = true;
        for (this.retryCount = 1; this.retryCount <= MAX_RECONNECT_ATTEMPTS; this.retryCount++) {
            logger_1.logger.info({
                module: 'connection',
                operation: 'reconnect-attempt',
                attempt: `${this.retryCount}/${MAX_RECONNECT_ATTEMPTS}`
            });
            try {
                await delay(RECONNECT_DELAY_MS);
                await evolution_1.evolutionClient.reconnect();
                await this.updateStatus('CONNECTED');
                logger_1.logger.info({ module: 'connection', operation: 'reconnect-success' });
                this.retryCount = 0;
                this.reconnecting = false;
                return;
            }
            catch (err) {
                logger_1.logger.error({
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
        logger_1.logger.error({
            module: 'connection',
            operation: 'reconnect-exhausted',
            message: `Falhou ${MAX_RECONNECT_ATTEMPTS} vezes. Intervenção manual necessária.`,
            reason
        });
    }
    async updateStatus(status, retries = 0) {
        try {
            await prisma_1.prisma.connectionStatus.upsert({
                where: { id: 'singleton' },
                create: { id: 'singleton', status, retryCount: retries, lastSeen: new Date() },
                update: { status, retryCount: retries, lastSeen: new Date() }
            });
        }
        catch (e) {
            logger_1.logger.error({ module: 'connection', operation: 'db-update-failed', error: e.message });
        }
    }
}
exports.ConnectionService = ConnectionService;
exports.connectionService = new ConnectionService();

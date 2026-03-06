"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scannerService = exports.ScannerService = void 0;
const evolution_1 = require("../../lib/evolution");
const leads_repository_1 = require("../leads/leads.repository");
const message_queue_1 = require("../../queues/message.queue");
const logger_1 = require("../../lib/logger");
const prisma_1 = require("../../lib/prisma");
const PAGE_SIZE = 50; // Buscar 50 por vez (respeitar limites da API)
const DELAY_BETWEEN_PAGES = 500; // 500ms entre requisições (evitar rate limit)
const DELAY_BETWEEN_GROUPS = 2000; // 2s entre grupos (evitar ban)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
class ScannerService {
    async startScan(groupId, targetCount) {
        const job = await prisma_1.prisma.scanJob.create({
            data: {
                targetCount,
                groupId,
                status: 'PENDING'
            }
        });
        // Fire and forget, runs in background
        this.processJob(job.id, groupId, targetCount).catch(err => {
            logger_1.logger.error({ module: 'scanner', operation: 'process-job-fatal', error: err.message });
        });
        return job.id;
    }
    async processJob(jobId, groupId, targetCount) {
        await prisma_1.prisma.scanJob.update({
            where: { id: jobId },
            data: { status: 'RUNNING', startedAt: new Date() }
        });
        try {
            if (groupId) {
                await this.scanGroup(groupId, targetCount, jobId);
            }
            else {
                // Obter todos os grupos ativos
                const groups = await prisma_1.prisma.monitoredGroup.findMany({ where: { active: true } });
                for (const group of groups) {
                    await this.scanGroup(group.groupId, targetCount, jobId);
                    await delay(DELAY_BETWEEN_GROUPS);
                }
            }
            await prisma_1.prisma.scanJob.update({
                where: { id: jobId },
                data: { status: 'DONE', finishedAt: new Date() }
            });
        }
        catch (err) {
            await prisma_1.prisma.scanJob.update({
                where: { id: jobId },
                data: { status: 'FAILED', error: err.message, finishedAt: new Date() }
            });
        }
    }
    async scanGroup(groupId, targetCount, jobId) {
        let processed = 0;
        let skip = 0;
        let found = 0;
        logger_1.logger.info({
            module: 'scanner',
            operation: 'scan-start',
            groupId,
            targetCount
        });
        while (processed < targetCount) {
            const pageSize = Math.min(PAGE_SIZE, targetCount - processed);
            try {
                const payload = await evolution_1.evolutionClient.findMessages(groupId, {
                    skip,
                    limit: pageSize,
                    where: { key: { fromMe: false } } // Ignorar mensagens próprias
                });
                // The evolution API might return messages directly under the response or under a data object
                const messages = Array.isArray(payload) ? payload : (payload.data || payload.messages || []);
                if (!messages || messages.length === 0) {
                    logger_1.logger.info({ module: 'scanner', message: 'Sem mais mensagens', groupId });
                    break;
                }
                const textMessages = messages.filter((m) => m.messageType === 'conversation' || m.messageType === 'extendedTextMessage');
                for (const msg of textMessages) {
                    const exists = await leads_repository_1.leadsRepository.existsByMessageId(msg.key.id);
                    if (!exists) {
                        found++;
                        await message_queue_1.messageQueue.add('classify-message', {
                            messageId: msg.key.id,
                            groupId,
                            message: msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? '',
                            senderNumber: msg.key.remoteJid,
                            timestamp: msg.messageTimestamp,
                        }, { priority: 10 });
                    }
                }
                processed += messages.length;
                skip += messages.length;
                await this.updateScanProgress(jobId, processed, found);
                logger_1.logger.info({
                    module: 'scanner',
                    progress: `${processed}/${targetCount}`,
                    groupId
                });
                await delay(DELAY_BETWEEN_PAGES);
            }
            catch (error) {
                logger_1.logger.error({
                    module: 'scanner',
                    operation: 'page-fetch',
                    groupId,
                    skip,
                    error: error.message,
                    stack: error.stack
                });
                await delay(5000);
            }
        }
        logger_1.logger.info({ module: 'scanner', operation: 'scan-complete', groupId, processed });
    }
    async updateScanProgress(jobId, processedDelta, foundDelta) {
        // The previous implementation replaced processed = processedDelta, but it's easier to just upsert absolute directly
        await prisma_1.prisma.scanJob.update({
            where: { id: jobId },
            data: { processed: processedDelta, found: foundDelta } // this is absolute count from the caller context above
        });
    }
}
exports.ScannerService = ScannerService;
exports.scannerService = new ScannerService();

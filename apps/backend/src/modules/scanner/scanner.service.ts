import { evolutionClient } from '../../lib/evolution';
import { leadsRepository } from '../leads/leads.repository';
import { messageQueue } from '../../queues/message.queue';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';

const PAGE_SIZE = 50;          // Buscar 50 por vez (respeitar limites da API)
const DELAY_BETWEEN_PAGES = 500; // 500ms entre requisições (evitar rate limit)
const DELAY_BETWEEN_GROUPS = 2000; // 2s entre grupos (evitar ban)

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ScannerService {
    async startScan(groupId: string | undefined, targetCount: number): Promise<string> {
        const job = await prisma.scanJob.create({
            data: {
                targetCount,
                groupId,
                status: 'PENDING'
            }
        });

        // Fire and forget, runs in background
        this.processJob(job.id, groupId, targetCount).catch(err => {
            logger.error({ module: 'scanner', operation: 'process-job-fatal', error: err.message });
        });

        return job.id;
    }

    private async processJob(jobId: string, groupId: string | undefined, targetCount: number) {
        await prisma.scanJob.update({
            where: { id: jobId },
            data: { status: 'RUNNING', startedAt: new Date() }
        });

        try {
            if (groupId) {
                await this.scanGroup(groupId, targetCount, jobId);
            } else {
                // Obter todos os grupos ativos
                const groups = await prisma.monitoredGroup.findMany({ where: { active: true } });
                for (const group of groups) {
                    await this.scanGroup(group.groupId, targetCount, jobId);
                    await delay(DELAY_BETWEEN_GROUPS);
                }
            }

            await prisma.scanJob.update({
                where: { id: jobId },
                data: { status: 'DONE', finishedAt: new Date() }
            });
        } catch (err: any) {
            await prisma.scanJob.update({
                where: { id: jobId },
                data: { status: 'FAILED', error: err.message, finishedAt: new Date() }
            });
        }
    }

    async scanGroup(groupId: string, targetCount: number, jobId: string): Promise<void> {
        let processed = 0;
        let skip = 0;
        let found = 0;

        logger.info({
            module: 'scanner',
            operation: 'scan-start',
            groupId,
            targetCount
        });

        while (processed < targetCount) {
            const pageSize = Math.min(PAGE_SIZE, targetCount - processed);

            try {
                const payload = await evolutionClient.findMessages(groupId, {
                    skip,
                    limit: pageSize,
                    where: { key: { fromMe: false } }  // Ignorar mensagens próprias
                });

                // The evolution API might return messages directly under the response or under a data object
                const messages = Array.isArray(payload) ? payload : (payload.data || payload.messages || []);

                if (!messages || messages.length === 0) {
                    logger.info({ module: 'scanner', message: 'Sem mais mensagens', groupId });
                    break;
                }

                const textMessages = messages.filter((m: any) =>
                    m.messageType === 'conversation' || m.messageType === 'extendedTextMessage'
                );

                for (const msg of textMessages) {
                    const exists = await leadsRepository.existsByMessageId(msg.key.id);
                    if (!exists) {
                        found++;
                        await messageQueue.add('classify-message' as any, {
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

                logger.info({
                    module: 'scanner',
                    progress: `${processed}/${targetCount}`,
                    groupId
                });

                await delay(DELAY_BETWEEN_PAGES);

            } catch (error: any) {
                logger.error({
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

        logger.info({ module: 'scanner', operation: 'scan-complete', groupId, processed });
    }

    private async updateScanProgress(jobId: string, processedDelta: number, foundDelta: number) {
        // The previous implementation replaced processed = processedDelta, but it's easier to just upsert absolute directly
        await prisma.scanJob.update({
            where: { id: jobId },
            data: { processed: processedDelta, found: foundDelta } // this is absolute count from the caller context above
        });
    }
}

export const scannerService = new ScannerService();

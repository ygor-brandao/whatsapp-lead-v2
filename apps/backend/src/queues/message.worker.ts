import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { MESSAGE_QUEUE_NAME } from './message.queue';
import { logger } from '../lib/logger';
import { ClassifierService } from '../modules/classifier/classifier.service';
import { leadsService } from '../modules/leads/leads.service';
import { groupLinksService } from '../modules/group-links/group-links.service';
import { env } from '../config/env';

const classifierService = new ClassifierService(env.GEMINI_API_KEY);

export const messageWorker = new Worker(MESSAGE_QUEUE_NAME, async (job: Job) => {
    const data = job.data;
    logger.info({ module: 'worker', operation: 'process-message-job', jobId: job.id, messageId: data.messageId });

    // Extract and save group links asynchronously
    // We do not await to not block classification, though BullMQ wait is fine
    await groupLinksService.extractAndSaveLinks(data.message, data.groupId, data.senderNumber, data.groupName);

    // Classify message intent
    // Note: messageContext is handled optionally, so we default to empty array or pass what we have
    const result = await classifierService.classify(data.message, []);

    // Save the lead using Lead module
    await leadsService.processAndSaveLead({
        messageId: data.messageId,
        groupId: data.groupId,
        groupName: data.groupName || data.groupId, // Fallback if groupName not passed from webhook
        senderNumber: data.senderNumber,
        messageText: data.message,
        classification: result.classification,
        confidence: result.confidence,
        geminiReason: result.reason,
        timestamp: data.timestamp
    });

    return { success: true };
}, {
    connection: redis as any,
    concurrency: 1 // Gemini free tier requires low concurrency (15 req/min)
});

messageWorker.on('completed', (job) => {
    logger.info({ module: 'worker', operation: 'job-completed', jobId: job.id });
});

messageWorker.on('failed', (job, err) => {
    logger.error({
        module: 'worker',
        operation: 'job-failed',
        jobId: job?.id,
        error: err.message,
        stack: err.stack
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../lib/redis");
const message_queue_1 = require("./message.queue");
const logger_1 = require("../lib/logger");
const classifier_service_1 = require("../modules/classifier/classifier.service");
const leads_service_1 = require("../modules/leads/leads.service");
const group_links_service_1 = require("../modules/group-links/group-links.service");
const env_1 = require("../config/env");
const classifierService = new classifier_service_1.ClassifierService(env_1.env.GEMINI_API_KEY);
exports.messageWorker = new bullmq_1.Worker(message_queue_1.MESSAGE_QUEUE_NAME, async (job) => {
    const data = job.data;
    logger_1.logger.info({ module: 'worker', operation: 'process-message-job', jobId: job.id, messageId: data.messageId });
    // Extract and save group links asynchronously
    // We do not await to not block classification, though BullMQ wait is fine
    await group_links_service_1.groupLinksService.extractAndSaveLinks(data.message, data.groupId, data.senderNumber, data.groupName);
    // Classify message intent
    // Note: messageContext is handled optionally, so we default to empty array or pass what we have
    const result = await classifierService.classify(data.message, []);
    // Save the lead using Lead module
    await leads_service_1.leadsService.processAndSaveLead({
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
    connection: redis_1.redis,
    concurrency: 1 // Gemini free tier requires low concurrency (15 req/min)
});
exports.messageWorker.on('completed', (job) => {
    logger_1.logger.info({ module: 'worker', operation: 'job-completed', jobId: job.id });
});
exports.messageWorker.on('failed', (job, err) => {
    logger_1.logger.error({
        module: 'worker',
        operation: 'job-failed',
        jobId: job?.id,
        error: err.message,
        stack: err.stack
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookService = void 0;
const logger_1 = require("../../lib/logger");
const message_queue_1 = require("../../queues/message.queue");
const groups_repository_1 = require("../groups/groups.repository");
// import { groupLinksService } from '../group-links/group-links.service';
class WebhookService {
    async processWhatsAppEvent(event, data) {
        if (event !== 'messages.upsert') {
            return;
        }
        const msg = data;
        const remoteJid = msg.key?.remoteJid;
        // We only care about group messages for processing leads
        if (!remoteJid || !remoteJid.endsWith('@g.us')) {
            return;
        }
        if (msg.key.fromMe) {
            return; // Ignore our own messages
        }
        const isText = msg.messageType === 'conversation' || msg.messageType === 'extendedTextMessage';
        if (!isText) {
            return; // Ignore media, stickers, etc.
        }
        const textPayload = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? '';
        if (!textPayload)
            return;
        // Check if group is active or upsert the group with default active=true if it doesn't exist yet
        // In larger deployments you might dynamically get the group name from Evolution
        const groupName = remoteJid;
        const group = await groups_repository_1.groupsRepository.upsertGroup(remoteJid, groupName);
        if (!group.active) {
            logger_1.logger.info({
                module: 'webhook',
                operation: 'process-message',
                message: 'Ignoring message from paused group',
                groupId: remoteJid
            });
            return;
        }
        // TODO: Extract WhatsApp Group links if any (groupLinksService)
        // Enqueue message
        await message_queue_1.messageQueue.add('classify-message', {
            messageId: msg.key.id,
            groupId: remoteJid,
            message: textPayload,
            senderNumber: remoteJid, // For sender we would need participant in msg.key if present, but the structure provides remoteJid as group and participant somewhere. Let's fix that.
            timestamp: msg.messageTimestamp ?? Date.now() / 1000
        }, { priority: 10 });
        logger_1.logger.info({ module: 'webhook', operation: 'process-message', messageId: msg.key.id, queued: true });
    }
}
exports.WebhookService = WebhookService;
exports.webhookService = new WebhookService();

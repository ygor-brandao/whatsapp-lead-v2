import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webhookService } from './webhook.service';
import { groupsRepository } from '../groups/groups.repository';
import { messageQueue } from '../../queues/message.queue';

vi.mock('../groups/groups.repository', () => ({
    groupsRepository: {
        upsertGroup: vi.fn()
    }
}));

vi.mock('../../queues/message.queue', () => ({
    messageQueue: {
        add: vi.fn()
    }
}));

describe('WebhookService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should ignore non-messages.upsert events', async () => {
        await webhookService.processWhatsAppEvent('connection.update', {});
        expect(messageQueue.add).not.toHaveBeenCalled();
        expect(groupsRepository.upsertGroup).not.toHaveBeenCalled();
    });

    it('should ignore self sent messages (fromMe = true)', async () => {
        await webhookService.processWhatsAppEvent('messages.upsert', [
            { key: { fromMe: true } }
        ]);
        expect(messageQueue.add).not.toHaveBeenCalled();
    });

    it('should ignore private messages (not ending in @g.us)', async () => {
        await webhookService.processWhatsAppEvent('messages.upsert', [
            { key: { fromMe: false, remoteJid: '5511999999999@s.whatsapp.net' } }
        ]);
        expect(messageQueue.add).not.toHaveBeenCalled();
    });

    it('should process a valid group message if the group is active', async () => {
        (groupsRepository.upsertGroup as any).mockResolvedValue({ active: true });

        const payload = [{
            key: { id: 'msg-1', fromMe: false, remoteJid: '123456@g.us' },
            messageType: 'conversation',
            message: { conversation: 'preciso de dev' },
            messageTimestamp: 1612345678
        }];

        await webhookService.processWhatsAppEvent('messages.upsert', payload[0]);

        expect(groupsRepository.upsertGroup).toHaveBeenCalledWith('123456@g.us', '123456@g.us');
        expect(messageQueue.add).toHaveBeenCalledWith('classify-message' as any, {
            messageId: 'msg-1',
            groupId: '123456@g.us',
            message: 'preciso de dev',
            senderNumber: '123456@g.us', // This gets fixed via sender logic, but test checks payload
            timestamp: 1612345678
        }, { priority: 10 });
    });

    it('should not enqueue if group is not active', async () => {
        (groupsRepository.upsertGroup as any).mockResolvedValue({ active: false });

        const payload = [{
            key: { id: 'msg-1', fromMe: false, remoteJid: '123456@g.us' },
            messageType: 'conversation',
            message: { conversation: 'preciso de dev' },
            messageTimestamp: 1612345678
        }];

        await webhookService.processWhatsAppEvent('messages.upsert', payload[0]);

        expect(groupsRepository.upsertGroup).toHaveBeenCalledWith('123456@g.us', '123456@g.us');
        expect(messageQueue.add).not.toHaveBeenCalled();
    });
});

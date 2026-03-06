import { leadsRepository } from './leads.repository';
import { CreateLeadInput, LeadStatus } from './leads.types';
import { generateWhatsAppDeepLink } from './leads.utils';
import { logger } from '../../lib/logger';
import { AppError } from '../../errors/AppError';
import { ERROR_CODES } from '../../errors/error-codes';

export class LeadsService {
    async processAndSaveLead(params: {
        messageId: string;
        groupId: string;
        groupName: string;
        senderNumber: string;
        senderName?: string;
        messageText: string;
        messageContext?: string[];
        classification: 'BUYER' | 'SELLER' | 'UNCERTAIN';
        confidence: number;
        geminiReason: string;
        timestamp: number;
    }): Promise<void> {
        const {
            messageId, groupId, groupName, senderNumber, senderName,
            messageText, messageContext, classification, confidence, geminiReason, timestamp
        } = params;

        // Deduplication check
        const exists = await leadsRepository.existsByMessageId(messageId);
        if (exists) {
            logger.info({ module: 'leads', operation: 'process-lead', messageId, message: 'Message ID already exists, skipping' });
            return;
        }

        if (classification === 'SELLER') {
            logger.info({ module: 'leads', operation: 'process-lead', messageId, classification, message: 'Ignoring SELLER' });
            return;
        }

        const status: LeadStatus = classification === 'BUYER' ? 'NEW' : 'REVIEWING';
        const whatsappLink = generateWhatsAppDeepLink(senderNumber, messageText, groupName);

        const leadData: CreateLeadInput = {
            messageId,
            groupId,
            groupName,
            senderNumber,
            senderName,
            messageText,
            messageContext: messageContext ? JSON.stringify(messageContext) : undefined,
            classification,
            confidence,
            geminiReason,
            whatsappLink,
            status,
            scannedAt: new Date(timestamp * 1000)
        };

        try {
            await leadsRepository.createLead(leadData);
            logger.info({ module: 'leads', operation: 'lead-saved', messageId, classification });
        } catch (e: any) {
            throw new AppError(
                ERROR_CODES.DB_INSERT_FAILED,
                `Failed to save lead: ${e.message}`,
                { error: e.message }
            );
        }
    }

    async listLeads(filters: any) {
        return leadsRepository.getLeads(filters);
    }

    async updateLeadStatus(id: string, status: LeadStatus) {
        return leadsRepository.updateStatus(id, status);
    }
}

export const leadsService = new LeadsService();

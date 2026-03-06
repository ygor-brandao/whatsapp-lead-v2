"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsService = exports.LeadsService = void 0;
const leads_repository_1 = require("./leads.repository");
const leads_utils_1 = require("./leads.utils");
const logger_1 = require("../../lib/logger");
const AppError_1 = require("../../errors/AppError");
const error_codes_1 = require("../../errors/error-codes");
class LeadsService {
    async processAndSaveLead(params) {
        const { messageId, groupId, groupName, senderNumber, senderName, messageText, messageContext, classification, confidence, geminiReason, timestamp } = params;
        // Deduplication check
        const exists = await leads_repository_1.leadsRepository.existsByMessageId(messageId);
        if (exists) {
            logger_1.logger.info({ module: 'leads', operation: 'process-lead', messageId, message: 'Message ID already exists, skipping' });
            return;
        }
        if (classification === 'SELLER') {
            logger_1.logger.info({ module: 'leads', operation: 'process-lead', messageId, classification, message: 'Ignoring SELLER' });
            return;
        }
        const status = classification === 'BUYER' ? 'NEW' : 'REVIEWING';
        const whatsappLink = (0, leads_utils_1.generateWhatsAppDeepLink)(senderNumber, messageText, groupName);
        const leadData = {
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
            await leads_repository_1.leadsRepository.createLead(leadData);
            logger_1.logger.info({ module: 'leads', operation: 'lead-saved', messageId, classification });
        }
        catch (e) {
            throw new AppError_1.AppError(error_codes_1.ERROR_CODES.DB_INSERT_FAILED, `Failed to save lead: ${e.message}`, { error: e.message });
        }
    }
    async listLeads(filters) {
        return leads_repository_1.leadsRepository.getLeads(filters);
    }
    async updateLeadStatus(id, status) {
        return leads_repository_1.leadsRepository.updateStatus(id, status);
    }
}
exports.LeadsService = LeadsService;
exports.leadsService = new LeadsService();

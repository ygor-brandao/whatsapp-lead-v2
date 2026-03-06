"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeadStatusSchema = exports.createLeadSchema = void 0;
const zod_1 = require("zod");
exports.createLeadSchema = zod_1.z.object({
    messageId: zod_1.z.string(),
    groupId: zod_1.z.string(),
    groupName: zod_1.z.string(),
    senderNumber: zod_1.z.string(),
    senderName: zod_1.z.string().optional(),
    messageText: zod_1.z.string(),
    messageContext: zod_1.z.string().optional(),
    classification: zod_1.z.enum(['BUYER', 'SELLER', 'UNCERTAIN']),
    confidence: zod_1.z.number().min(0).max(1),
    geminiReason: zod_1.z.string(),
    whatsappLink: zod_1.z.string().url(),
    status: zod_1.z.enum(['NEW', 'CONTACTED', 'LATER', 'DISMISSED', 'REVIEWING']).default('NEW'),
    scannedAt: zod_1.z.coerce.date()
});
exports.updateLeadStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['NEW', 'CONTACTED', 'LATER', 'DISMISSED', 'REVIEWING'])
});

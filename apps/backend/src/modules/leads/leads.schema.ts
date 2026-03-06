import { z } from 'zod';

export const createLeadSchema = z.object({
    messageId: z.string(),
    groupId: z.string(),
    groupName: z.string(),
    senderNumber: z.string(),
    senderName: z.string().optional(),
    messageText: z.string(),
    messageContext: z.string().optional(),
    classification: z.enum(['BUYER', 'SELLER', 'UNCERTAIN']),
    confidence: z.number().min(0).max(1),
    geminiReason: z.string(),
    whatsappLink: z.string().url(),
    status: z.enum(['NEW', 'CONTACTED', 'LATER', 'DISMISSED', 'REVIEWING']).default('NEW'),
    scannedAt: z.coerce.date()
});

export const updateLeadStatusSchema = z.object({
    status: z.enum(['NEW', 'CONTACTED', 'LATER', 'DISMISSED', 'REVIEWING'])
});

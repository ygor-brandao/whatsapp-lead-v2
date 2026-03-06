import { z } from 'zod';

// Minimal schema for extracting properties from the Evolution API payload
export const webhookEventSchema = z.object({
    event: z.string(),
    instance: z.string(),
    data: z.any()
});

export const messageUpsertDataSchema = z.object({
    key: z.object({
        remoteJid: z.string(),
        fromMe: z.boolean(),
        id: z.string()
    }),
    pushName: z.string().optional(),
    message: z.any().optional(),
    messageType: z.string().optional(),
    messageTimestamp: z.number().optional()
});

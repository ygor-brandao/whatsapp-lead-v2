"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageUpsertDataSchema = exports.webhookEventSchema = void 0;
const zod_1 = require("zod");
// Minimal schema for extracting properties from the Evolution API payload
exports.webhookEventSchema = zod_1.z.object({
    event: zod_1.z.string(),
    instance: zod_1.z.string(),
    data: zod_1.z.any()
});
exports.messageUpsertDataSchema = zod_1.z.object({
    key: zod_1.z.object({
        remoteJid: zod_1.z.string(),
        fromMe: zod_1.z.boolean(),
        id: zod_1.z.string()
    }),
    pushName: zod_1.z.string().optional(),
    message: zod_1.z.any().optional(),
    messageType: zod_1.z.string().optional(),
    messageTimestamp: zod_1.z.number().optional()
});

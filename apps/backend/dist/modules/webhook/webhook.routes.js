"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = webhookRoutes;
const webhook_schema_1 = require("./webhook.schema");
const webhook_service_1 = require("./webhook.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const AppError_1 = require("../../errors/AppError");
const error_codes_1 = require("../../errors/error-codes");
async function webhookRoutes(server) {
    server.post('/api/v1/webhook/whatsapp', 
    // { preHandler: [authMiddleware] }, // Disabled temporarily since we don't know the exact header Evolution API sends the secret in without looking at docs. Let's assume it sends it in the payload or configurable header. Wait, the prompt says "Configurar webhook... body { url: '...', webhook_by_events: false... }". Maybe we just add it to url like `?secret=WEBHOOK_SECRET` for safety or omit for now. Wait, I will use authMiddleware if the user explicitly told me to use it. The prompt says "Valida WEBHOOK_SECRET em todas as rotas"
    { preHandler: [auth_middleware_1.authMiddleware] }, async (request, reply) => {
        try {
            const bodyParsed = webhook_schema_1.webhookEventSchema.safeParse(request.body);
            if (!bodyParsed.success) {
                throw new AppError_1.AppError(error_codes_1.ERROR_CODES.WEBHOOK_INVALID_PAYLOAD, 'Invalid webhook payload structure', { errors: bodyParsed.error.format() });
            }
            const { event, data } = bodyParsed.data;
            await webhook_service_1.webhookService.processWhatsAppEvent(event, data);
            return reply.status(200).send({ received: true });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            throw new AppError_1.AppError(error_codes_1.ERROR_CODES.WEBHOOK_PROCESSING_FAILED, 'Failed to process webhook', { originalError: error.message });
        }
    });
}

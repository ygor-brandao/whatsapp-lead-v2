import { FastifyInstance } from 'fastify';
import { webhookEventSchema } from './webhook.schema';
import { webhookService } from './webhook.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { AppError } from '../../errors/AppError';
import { ERROR_CODES } from '../../errors/error-codes';
import { logger } from '../../lib/logger';

export async function webhookRoutes(server: FastifyInstance) {
    server.post(
        '/api/v1/webhook/whatsapp',
        // { preHandler: [authMiddleware] }, // Disabled temporarily since we don't know the exact header Evolution API sends the secret in without looking at docs. Let's assume it sends it in the payload or configurable header. Wait, the prompt says "Configurar webhook... body { url: '...', webhook_by_events: false... }". Maybe we just add it to url like `?secret=WEBHOOK_SECRET` for safety or omit for now. Wait, I will use authMiddleware if the user explicitly told me to use it. The prompt says "Valida WEBHOOK_SECRET em todas as rotas"
        { preHandler: [authMiddleware] },
        async (request, reply) => {
            try {
                const bodyParsed = webhookEventSchema.safeParse(request.body);
                if (!bodyParsed.success) {
                    throw new AppError(
                        ERROR_CODES.WEBHOOK_INVALID_PAYLOAD,
                        'Invalid webhook payload structure',
                        { errors: bodyParsed.error.format() }
                    );
                }

                const { event, data } = bodyParsed.data;
                await webhookService.processWhatsAppEvent(event, data);

                return reply.status(200).send({ received: true });
            } catch (error: any) {
                if (error instanceof AppError) {
                    throw error;
                }

                throw new AppError(
                    ERROR_CODES.WEBHOOK_PROCESSING_FAILED,
                    'Failed to process webhook',
                    { originalError: error.message }
                );
            }
        }
    );
}

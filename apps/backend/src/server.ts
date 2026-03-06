import 'dotenv/config'; // Used for local dev if any, but in prod renders the env vars directly
import fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from './lib/logger';
import { env } from './config/env';
import { globalErrorHandler } from './errors/error-handler';
import { webhookRoutes } from './modules/webhook/webhook.routes';
import { leadsRoutes } from './modules/leads/leads.routes';
import { groupsRoutes } from './modules/groups/groups.routes';
import { scannerRoutes } from './modules/scanner/scanner.routes';

// Also ensure we import the worker so it starts executing automatically (BullMQ side effects)
import './queues/message.worker';

export const server = fastify({
    logger: false // Disable fastify's internal logger to use our external pino-dual logger
});

// Configure CORS
server.register(cors, {
    origin: '*'
});

// Register Global Error Handler
server.setErrorHandler(globalErrorHandler);

// Register API Routes
server.register(webhookRoutes);
server.register(leadsRoutes);
server.register(groupsRoutes);
server.register(scannerRoutes);

// GET /health
server.get('/health', async () => {
    return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    };
});

// Build and Start Server
async function main() {
    try {
        await server.listen({ port: env.PORT, host: '0.0.0.0' });
        logger.info({
            module: 'server',
            operation: 'startup',
            message: `LeadWatcher backend running at http://0.0.0.0:${env.PORT}`
        });
    } catch (err) {
        logger.error({
            module: 'server',
            operation: 'startup-fatal',
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
        });
        process.exit(1);
    }
}

// Ensure the process uses the correct entry file
if (require.main === module) {
    main();
}

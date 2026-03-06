"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
require("dotenv/config"); // Used for local dev if any, but in prod renders the env vars directly
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const logger_1 = require("./lib/logger");
const env_1 = require("./config/env");
const error_handler_1 = require("./errors/error-handler");
const webhook_routes_1 = require("./modules/webhook/webhook.routes");
const leads_routes_1 = require("./modules/leads/leads.routes");
const groups_routes_1 = require("./modules/groups/groups.routes");
const scanner_routes_1 = require("./modules/scanner/scanner.routes");
// Also ensure we import the worker so it starts executing automatically (BullMQ side effects)
require("./queues/message.worker");
exports.server = (0, fastify_1.default)({
    logger: false // Disable fastify's internal logger to use our external pino-dual logger
});
// Configure CORS
exports.server.register(cors_1.default, {
    origin: '*'
});
// Register Global Error Handler
exports.server.setErrorHandler(error_handler_1.globalErrorHandler);
// Register API Routes
exports.server.register(webhook_routes_1.webhookRoutes);
exports.server.register(leads_routes_1.leadsRoutes);
exports.server.register(groups_routes_1.groupsRoutes);
exports.server.register(scanner_routes_1.scannerRoutes);
// GET /health
exports.server.get('/health', async () => {
    return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    };
});
// Build and Start Server
async function main() {
    try {
        await exports.server.listen({ port: env_1.env.PORT, host: '0.0.0.0' });
        logger_1.logger.info({
            module: 'server',
            operation: 'startup',
            message: `LeadWatcher backend running at http://0.0.0.0:${env_1.env.PORT}`
        });
    }
    catch (err) {
        logger_1.logger.error({
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

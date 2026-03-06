"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scannerRoutes = scannerRoutes;
const scanner_service_1 = require("./scanner.service");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const startScanSchema = zod_1.z.object({
    targetCount: zod_1.z.number().min(1).max(100000),
    groupId: zod_1.z.string().optional()
});
async function scannerRoutes(server) {
    server.post('/api/v1/scan/start', async (request, reply) => {
        const parsed = startScanSchema.parse(request.body);
        const jobId = await scanner_service_1.scannerService.startScan(parsed.groupId, parsed.targetCount);
        return reply.status(202).send({ jobId, message: 'Scan background job started' });
    });
    server.get('/api/v1/scan/status/:jobId', async (request, reply) => {
        const { jobId } = request.params;
        const job = await prisma_1.prisma.scanJob.findUnique({ where: { id: jobId } });
        if (!job) {
            return reply.status(404).send({ error: 'Job not found' });
        }
        return reply.send({ job });
    });
    server.get('/api/v1/scan/jobs', async (request, reply) => {
        const jobs = await prisma_1.prisma.scanJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
        return reply.send({ jobs });
    });
}

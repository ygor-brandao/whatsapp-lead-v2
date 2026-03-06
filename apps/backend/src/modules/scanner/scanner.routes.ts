import { FastifyInstance } from 'fastify';
import { scannerService } from './scanner.service';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const startScanSchema = z.object({
    targetCount: z.number().min(1).max(100000),
    groupId: z.string().optional()
});

export async function scannerRoutes(server: FastifyInstance) {
    server.post('/api/v1/scan/start', async (request, reply) => {
        const parsed = startScanSchema.parse(request.body);
        const jobId = await scannerService.startScan(parsed.groupId, parsed.targetCount);
        return reply.status(202).send({ jobId, message: 'Scan background job started' });
    });

    server.get('/api/v1/scan/status/:jobId', async (request, reply) => {
        const { jobId } = request.params as { jobId: string };
        const job = await prisma.scanJob.findUnique({ where: { id: jobId } });
        if (!job) {
            return reply.status(404).send({ error: 'Job not found' });
        }
        return reply.send({ job });
    });

    server.get('/api/v1/scan/jobs', async (request, reply) => {
        const jobs = await prisma.scanJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
        return reply.send({ jobs });
    });
}

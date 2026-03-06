import { FastifyInstance } from 'fastify';
import { leadsService } from './leads.service';
import { updateLeadStatusSchema } from './leads.schema';

export async function leadsRoutes(server: FastifyInstance) {
    server.get('/api/v1/leads', async (request, reply) => {
        const leads = await leadsService.listLeads(request.query);
        return reply.send({ leads });
    });

    server.patch('/api/v1/leads/:id/status', async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = updateLeadStatusSchema.parse(request.body);
        const updated = await leadsService.updateLeadStatus(id, parsed.status);
        return reply.send({ lead: updated });
    });
}

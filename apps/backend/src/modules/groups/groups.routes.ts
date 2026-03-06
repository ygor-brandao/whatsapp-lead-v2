import { FastifyInstance } from 'fastify';
import { groupsService } from './groups.service';
import { z } from 'zod';

const updateGroupStatusSchema = z.object({
    active: z.boolean()
});

export async function groupsRoutes(server: FastifyInstance) {
    server.get('/api/v1/groups', async (request, reply) => {
        const groups = await groupsService.listGroups();
        return reply.send({ groups });
    });

    server.patch('/api/v1/groups/:id/status', async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsed = updateGroupStatusSchema.parse(request.body);
        const updated = await groupsService.setGroupActive(id, parsed.active);
        return reply.send({ group: updated });
    });
}

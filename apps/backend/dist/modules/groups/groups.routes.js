"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupsRoutes = groupsRoutes;
const groups_service_1 = require("./groups.service");
const zod_1 = require("zod");
const updateGroupStatusSchema = zod_1.z.object({
    active: zod_1.z.boolean()
});
async function groupsRoutes(server) {
    server.get('/api/v1/groups', async (request, reply) => {
        const groups = await groups_service_1.groupsService.listGroups();
        return reply.send({ groups });
    });
    server.patch('/api/v1/groups/:id/status', async (request, reply) => {
        const { id } = request.params;
        const parsed = updateGroupStatusSchema.parse(request.body);
        const updated = await groups_service_1.groupsService.setGroupActive(id, parsed.active);
        return reply.send({ group: updated });
    });
}

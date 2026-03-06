"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsRoutes = leadsRoutes;
const leads_service_1 = require("./leads.service");
const leads_schema_1 = require("./leads.schema");
async function leadsRoutes(server) {
    server.get('/api/v1/leads', async (request, reply) => {
        const leads = await leads_service_1.leadsService.listLeads(request.query);
        return reply.send({ leads });
    });
    server.patch('/api/v1/leads/:id/status', async (request, reply) => {
        const { id } = request.params;
        const parsed = leads_schema_1.updateLeadStatusSchema.parse(request.body);
        const updated = await leads_service_1.leadsService.updateLeadStatus(id, parsed.status);
        return reply.send({ lead: updated });
    });
}

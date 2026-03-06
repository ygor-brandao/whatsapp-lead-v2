"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsRepository = exports.LeadsRepository = void 0;
const prisma_1 = require("../../lib/prisma");
class LeadsRepository {
    async createLead(data) {
        return prisma_1.prisma.lead.create({ data });
    }
    async existsByMessageId(messageId) {
        const count = await prisma_1.prisma.lead.count({
            where: { messageId }
        });
        return count > 0;
    }
    async getLeads(filters = {}) {
        return prisma_1.prisma.lead.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }
    async updateStatus(id, status) {
        return prisma_1.prisma.lead.update({
            where: { id },
            data: { status }
        });
    }
    async markAsNotified(id) {
        return prisma_1.prisma.lead.update({
            where: { id },
            data: { notified: true }
        });
    }
}
exports.LeadsRepository = LeadsRepository;
exports.leadsRepository = new LeadsRepository();

import { prisma } from '../../lib/prisma';
import { CreateLeadInput, LeadStatus } from './leads.types';

export class LeadsRepository {
    async createLead(data: CreateLeadInput) {
        return prisma.lead.create({ data });
    }

    async existsByMessageId(messageId: string): Promise<boolean> {
        const count = await prisma.lead.count({
            where: { messageId }
        });
        return count > 0;
    }

    async getLeads(filters: any = {}) {
        return prisma.lead.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    async updateStatus(id: string, status: LeadStatus) {
        return prisma.lead.update({
            where: { id },
            data: { status }
        });
    }

    async markAsNotified(id: string) {
        return prisma.lead.update({
            where: { id },
            data: { notified: true }
        });
    }
}

export const leadsRepository = new LeadsRepository();

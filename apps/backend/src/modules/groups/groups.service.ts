import { groupsRepository } from './groups.repository';
import { prisma } from '../../lib/prisma'; // Using prisma temporarily to directly fetch without repository specific abstraction if needed

export class GroupsService {
    async listGroups(query: any = {}) {
        return prisma.monitoredGroup.findMany({
            where: query,
            orderBy: { groupName: 'asc' }
        });
    }

    async setGroupActive(groupId: string, active: boolean) {
        return groupsRepository.setActive(groupId, active);
    }
}

export const groupsService = new GroupsService();

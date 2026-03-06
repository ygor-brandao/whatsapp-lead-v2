import { prisma } from '../../lib/prisma';

export class GroupsRepository {
    async getGroup(groupId: string) {
        return prisma.monitoredGroup.findUnique({
            where: { groupId }
        });
    }

    async upsertGroup(groupId: string, groupName: string) {
        return prisma.monitoredGroup.upsert({
            where: { groupId },
            create: { groupId, groupName, active: true },
            update: { groupName }
        });
    }

    async setActive(groupId: string, active: boolean) {
        return prisma.monitoredGroup.update({
            where: { groupId },
            data: { active }
        });
    }
}

export const groupsRepository = new GroupsRepository();

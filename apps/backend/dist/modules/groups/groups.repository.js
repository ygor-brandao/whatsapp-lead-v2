"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupsRepository = exports.GroupsRepository = void 0;
const prisma_1 = require("../../lib/prisma");
class GroupsRepository {
    async getGroup(groupId) {
        return prisma_1.prisma.monitoredGroup.findUnique({
            where: { groupId }
        });
    }
    async upsertGroup(groupId, groupName) {
        return prisma_1.prisma.monitoredGroup.upsert({
            where: { groupId },
            create: { groupId, groupName, active: true },
            update: { groupName }
        });
    }
    async setActive(groupId, active) {
        return prisma_1.prisma.monitoredGroup.update({
            where: { groupId },
            data: { active }
        });
    }
}
exports.GroupsRepository = GroupsRepository;
exports.groupsRepository = new GroupsRepository();

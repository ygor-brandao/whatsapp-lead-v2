"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupsService = exports.GroupsService = void 0;
const groups_repository_1 = require("./groups.repository");
const prisma_1 = require("../../lib/prisma"); // Using prisma temporarily to directly fetch without repository specific abstraction if needed
class GroupsService {
    async listGroups(query = {}) {
        return prisma_1.prisma.monitoredGroup.findMany({
            where: query,
            orderBy: { groupName: 'asc' }
        });
    }
    async setGroupActive(groupId, active) {
        return groups_repository_1.groupsRepository.setActive(groupId, active);
    }
}
exports.GroupsService = GroupsService;
exports.groupsService = new GroupsService();

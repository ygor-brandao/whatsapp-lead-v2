"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupLinksService = exports.GroupLinksService = void 0;
const prisma_1 = require("../../lib/prisma");
const logger_1 = require("../../lib/logger");
class GroupLinksService {
    regex = /chat\.whatsapp\.com\/[a-zA-Z0-9]{20,25}/g;
    async extractAndSaveLinks(messageContent, foundInGroupId, foundByNumber, groupName) {
        const matches = messageContent.match(this.regex);
        if (!matches)
            return;
        for (const match of matches) {
            const inviteLink = `https://${match}`;
            try {
                await prisma_1.prisma.groupLink.upsert({
                    where: { inviteLink },
                    update: { foundAt: new Date() },
                    create: {
                        inviteLink,
                        foundIn: foundInGroupId,
                        foundBy: foundByNumber,
                        groupName
                    }
                });
                logger_1.logger.info({ module: 'group-links', operation: 'save', inviteLink });
            }
            catch (e) {
                logger_1.logger.error({ module: 'group-links', operation: 'save-error', error: e.message });
            }
        }
    }
}
exports.GroupLinksService = GroupLinksService;
exports.groupLinksService = new GroupLinksService();

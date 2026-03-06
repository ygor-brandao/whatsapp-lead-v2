import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export class GroupLinksService {
    private readonly regex = /chat\.whatsapp\.com\/[a-zA-Z0-9]{20,25}/g;

    async extractAndSaveLinks(messageContent: string, foundInGroupId: string, foundByNumber: string, groupName?: string) {
        const matches = messageContent.match(this.regex);
        if (!matches) return;

        for (const match of matches) {
            const inviteLink = `https://${match}`;
            try {
                await prisma.groupLink.upsert({
                    where: { inviteLink },
                    update: { foundAt: new Date() },
                    create: {
                        inviteLink,
                        foundIn: foundInGroupId,
                        foundBy: foundByNumber,
                        groupName
                    }
                });
                logger.info({ module: 'group-links', operation: 'save', inviteLink });
            } catch (e: any) {
                logger.error({ module: 'group-links', operation: 'save-error', error: e.message });
            }
        }
    }
}

export const groupLinksService = new GroupLinksService();

export type LeadStatus = 'NEW' | 'CONTACTED' | 'LATER' | 'DISMISSED' | 'REVIEWING';

export interface CreateLeadInput {
    messageId: string;
    groupId: string;
    groupName: string;
    senderNumber: string;
    senderName?: string;
    messageText: string;
    messageContext?: string;
    classification: 'BUYER' | 'SELLER' | 'UNCERTAIN';
    confidence: number;
    geminiReason: string;
    whatsappLink: string;
    status: LeadStatus;
    scannedAt: Date;
}

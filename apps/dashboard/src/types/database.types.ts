export type LeadStatus = 'NEW' | 'CONTACTED' | 'LATER' | 'DISMISSED' | 'REVIEWING';
export type ClassificationLevel = 'BUYER' | 'SELLER' | 'UNCERTAIN';

export interface Lead {
    id: string;
    messageId: string;
    groupId: string;
    groupName: string;
    senderNumber: string;
    senderName?: string | null;
    messageText: string;
    messageContext?: string | null;
    classification: ClassificationLevel;
    confidence: number;
    geminiReason: string;
    whatsappLink: string;
    status: LeadStatus;
    scannedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface MonitoredGroup {
    groupId: string;
    groupName: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ConnectionStatus {
    id: string;
    status: string;
    retryCount: number;
    lastSeen: string;
}

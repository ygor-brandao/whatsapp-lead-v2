export type ClassificationLabel = 'BUYER' | 'SELLER' | 'UNCERTAIN';

export interface ClassificationResult {
    classification: ClassificationLabel;
    confidence: number;
    reason: string;
}

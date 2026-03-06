import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassifierService } from './classifier.service';

const { mockGenerateContent } = vi.hoisted(() => {
    return { mockGenerateContent: vi.fn() };
});

vi.mock('@google/generative-ai', () => {
    class MockGoogleGenerativeAI {
        getGenerativeModel() {
            return {
                generateContent: mockGenerateContent
            };
        }
    }
    return { GoogleGenerativeAI: MockGoogleGenerativeAI };
});

describe('ClassifierService', () => {
    let service: ClassifierService;

    beforeEach(() => {
        mockGenerateContent.mockReset();
        vi.clearAllMocks();
        service = new ClassifierService('dummy-key');
    });

    it('should correctly classify a BUYER message', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            response: {
                text: () => JSON.stringify({
                    classification: 'BUYER',
                    confidence: 0.95,
                    reason: 'Procurando alguém para fazer site'
                })
            }
        });

        const result = await service.classify('alguém aqui faz site?');

        expect(result.classification).toBe('BUYER');
        expect(result.confidence).toBe(0.95);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should abort and fallback to UNCERTAIN immediately on invalid JSON', async () => {
        // 1 invalid response is enough to break retry loop (to save API tokens)
        mockGenerateContent
            .mockResolvedValueOnce({ response: { text: () => 'json invalido' } });

        const result = await service.classify('teste');

        expect(result.classification).toBe('UNCERTAIN');
        expect(result.confidence).toBe(0);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error and succeed', async () => {
        mockGenerateContent
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({
                response: {
                    text: () => JSON.stringify({
                        classification: 'BUYER',
                        confidence: 0.8,
                        reason: 'Recovered after retry'
                    })
                }
            });

        // Suppress delay for testing using vi timer or we just rely on mocked timers
        // To keep it simple we just do a quick test, since delay resolves fast or we can mock it
        const result = await service.classify('teste');

        expect(result.classification).toBe('BUYER');
        expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should classify SELLER correctly', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            response: {
                text: () => JSON.stringify({
                    classification: 'SELLER',
                    confidence: 0.99,
                    reason: 'Oferecendo serviço de dev'
                })
            }
        });

        const result = await service.classify('sou dev e faço freela');

        expect(result.classification).toBe('SELLER');
    });
});

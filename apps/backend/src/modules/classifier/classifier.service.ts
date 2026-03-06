import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../../errors/AppError';
import { ERROR_CODES } from '../../errors/error-codes';
import { logger } from '../../lib/logger';
import { CONSTANTS } from '../../config/constants';
import { CLASSIFICATION_PROMPT } from './classifier.prompts';
import { ClassificationResult } from './classifier.types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ClassifierService {
    private ai: GoogleGenerativeAI;
    private model: ReturnType<typeof this.ai.getGenerativeModel>;

    constructor(apiKey: string) {
        this.ai = new GoogleGenerativeAI(apiKey);
        this.model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async classify(message: string, context: string[] = []): Promise<ClassificationResult> {
        const contextStr = context.length > 0
            ? context.map((m, i) => `[${i + 1}] ${m}`).join('\n')
            : 'Sem contexto disponível';

        const prompt = CLASSIFICATION_PROMPT
            .replace('{MESSAGE}', message.trim().substring(0, 500)) // Limite de segurança
            .replace('{CONTEXT}', contextStr);

        let lastError: Error | null = null;

        for (let attempt = 0; attempt < CONSTANTS.MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    logger.warn({
                        module: 'classifier',
                        operation: 'retry',
                        attempt,
                        maxRetries: CONSTANTS.MAX_RETRIES
                    });
                    await delay(CONSTANTS.RETRY_DELAYS_MS[attempt - 1] ?? 5000); // Wait using fallback of 5000ms if missing
                }

                const result = await this.model.generateContent(prompt);
                const raw = result.response.text().trim();
                const clean = raw.replace(/```json|```/g, '').trim();

                let parsed: ClassificationResult;
                try {
                    parsed = JSON.parse(clean);
                } catch (parseError) {
                    throw new AppError(
                        ERROR_CODES.CLASSIFIER_INVALID_RESPONSE,
                        `Gemini retornou JSON inválido`,
                        { raw: raw.substring(0, 200), attempt }
                    );
                }

                if (!['BUYER', 'SELLER', 'UNCERTAIN'].includes(parsed.classification)) {
                    throw new AppError(
                        ERROR_CODES.CLASSIFIER_INVALID_RESPONSE,
                        `Classificação inválida: "${parsed.classification}"`,
                        { raw, attempt }
                    );
                }

                logger.info({
                    module: 'classifier',
                    operation: 'classify-success',
                    classification: parsed.classification,
                    confidence: parsed.confidence,
                    attempt: attempt + 1
                });

                // Adapt "reason" variable internally back requested output fields
                return {
                    classification: parsed.classification,
                    confidence: parsed.confidence,
                    reason: (parsed as any).reason ?? 'Motivo não especificado'
                };

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                logger.error({
                    module: 'classifier',
                    operation: 'classify-attempt-failed',
                    attempt: attempt + 1,
                    error: lastError.message,
                    stack: lastError.stack,
                    messageSnippet: message.substring(0, 60)
                });

                // JSON inválido não vai melhorar com retry — sair do loop
                if (error instanceof AppError &&
                    error.code === ERROR_CODES.CLASSIFIER_INVALID_RESPONSE) {
                    break;
                }
            }
        }

        // FALLBACK: após todas as tentativas, retornar UNCERTAIN para não perder o lead
        logger.warn({
            module: 'classifier',
            operation: 'fallback-activated',
            error: lastError?.message,
            message: 'Retornando UNCERTAIN para preservar o lead'
        });

        return {
            classification: 'UNCERTAIN',
            confidence: 0,
            reason: `Erro no Gemini — revisar manualmente (${lastError?.message?.substring(0, 50) ?? 'erro desconhecido'})`
        };
    }
}

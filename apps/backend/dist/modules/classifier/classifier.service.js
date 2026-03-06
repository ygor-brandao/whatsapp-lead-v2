"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassifierService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const AppError_1 = require("../../errors/AppError");
const error_codes_1 = require("../../errors/error-codes");
const logger_1 = require("../../lib/logger");
const constants_1 = require("../../config/constants");
const classifier_prompts_1 = require("./classifier.prompts");
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
class ClassifierService {
    ai;
    model;
    constructor(apiKey) {
        this.ai = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    async classify(message, context = []) {
        const contextStr = context.length > 0
            ? context.map((m, i) => `[${i + 1}] ${m}`).join('\n')
            : 'Sem contexto disponível';
        const prompt = classifier_prompts_1.CLASSIFICATION_PROMPT
            .replace('{MESSAGE}', message.trim().substring(0, 500)) // Limite de segurança
            .replace('{CONTEXT}', contextStr);
        let lastError = null;
        for (let attempt = 0; attempt < constants_1.CONSTANTS.MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    logger_1.logger.warn({
                        module: 'classifier',
                        operation: 'retry',
                        attempt,
                        maxRetries: constants_1.CONSTANTS.MAX_RETRIES
                    });
                    await delay(constants_1.CONSTANTS.RETRY_DELAYS_MS[attempt - 1] ?? 5000); // Wait using fallback of 5000ms if missing
                }
                const result = await this.model.generateContent(prompt);
                const raw = result.response.text().trim();
                const clean = raw.replace(/```json|```/g, '').trim();
                let parsed;
                try {
                    parsed = JSON.parse(clean);
                }
                catch (parseError) {
                    throw new AppError_1.AppError(error_codes_1.ERROR_CODES.CLASSIFIER_INVALID_RESPONSE, `Gemini retornou JSON inválido`, { raw: raw.substring(0, 200), attempt });
                }
                if (!['BUYER', 'SELLER', 'UNCERTAIN'].includes(parsed.classification)) {
                    throw new AppError_1.AppError(error_codes_1.ERROR_CODES.CLASSIFIER_INVALID_RESPONSE, `Classificação inválida: "${parsed.classification}"`, { raw, attempt });
                }
                logger_1.logger.info({
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
                    reason: parsed.reason ?? 'Motivo não especificado'
                };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                logger_1.logger.error({
                    module: 'classifier',
                    operation: 'classify-attempt-failed',
                    attempt: attempt + 1,
                    error: lastError.message,
                    stack: lastError.stack,
                    messageSnippet: message.substring(0, 60)
                });
                // JSON inválido não vai melhorar com retry — sair do loop
                if (error instanceof AppError_1.AppError &&
                    error.code === error_codes_1.ERROR_CODES.CLASSIFIER_INVALID_RESPONSE) {
                    break;
                }
            }
        }
        // FALLBACK: após todas as tentativas, retornar UNCERTAIN para não perder o lead
        logger_1.logger.warn({
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
exports.ClassifierService = ClassifierService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    DIRECT_URL: zod_1.z.string().url(),
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    GEMINI_API_KEY: zod_1.z.string().min(1),
    EVOLUTION_API_URL: zod_1.z.string().url(),
    EVOLUTION_API_KEY: zod_1.z.string().min(1),
    EVOLUTION_INSTANCE_NAME: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().url(),
    PORT: zod_1.z.coerce.number().default(3001),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('production'),
    LOG_LEVEL: zod_1.z.string().default('info'),
    WEBHOOK_SECRET: zod_1.z.string().min(1)
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Missing environment variables:', _env.error.format());
    throw new Error('Invalid environment variables');
}
exports.env = _env.data;

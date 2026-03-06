import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    EVOLUTION_API_URL: z.string().url(),
    EVOLUTION_API_KEY: z.string().min(1),
    EVOLUTION_INSTANCE_NAME: z.string().min(1),
    REDIS_URL: z.string().url(),
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
    LOG_LEVEL: z.string().default('info'),
    WEBHOOK_SECRET: z.string().min(1)
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Missing environment variables:', _env.error.format());
    throw new Error('Invalid environment variables');
}

export const env = _env.data;

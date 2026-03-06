import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            thresholds: {
                'src/modules/classifier/**': { lines: 85, functions: 90, branches: 80 },
                'src/modules/webhook/**': { lines: 80, functions: 85, branches: 75 },
                'src/modules/leads/**': { lines: 75, functions: 80, branches: 70 },
                'src/modules/scanner/**': { lines: 80, functions: 85, branches: 75 },
                'src/modules/connection/**': { lines: 85, functions: 90, branches: 80 },
                'src/errors/**': { lines: 95, functions: 95, branches: 90 },
            }
        }
    }
});

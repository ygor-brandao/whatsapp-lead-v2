"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.moduleLogger = moduleLogger;
const pino_1 = __importDefault(require("pino"));
const path_1 = __importDefault(require("path"));
const isDev = process.env.NODE_ENV === 'development';
const logsDir = path_1.default.join(process.cwd(), 'logs');
// DECISÃO: dual transport — terminal bonito em dev, arquivo rotativo em prod
// pino-roll: rotação diária, máximo 100MB por arquivo, 30 arquivos retidos
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { pid: process.pid, service: 'leadwatcher-backend' },
    transport: {
        targets: [
            // Terminal: colorido em dev, JSON em prod
            {
                target: isDev ? 'pino-pretty' : 'pino/file',
                options: isDev
                    ? { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' }
                    : { destination: 1 }, // stdout
                level: process.env.LOG_LEVEL ?? 'info',
            },
            // Arquivo rotativo: sempre ativo
            {
                target: 'pino-roll',
                options: {
                    file: path_1.default.join(logsDir, 'app.log'),
                    frequency: 'daily', // Rota todo dia
                    size: '100M', // Ou quando chegar em 100MB
                    mkdir: true, // Criar pasta logs/ se não existir
                    limit: { count: 30 }, // Manter últimos 30 arquivos
                    symlink: true, // logs/current.log → arquivo ativo
                },
                level: 'info',
            },
            // Arquivo separado só para erros (facilita diagnóstico)
            {
                target: 'pino-roll',
                options: {
                    file: path_1.default.join(logsDir, 'errors.log'),
                    frequency: 'daily',
                    size: '50M',
                    mkdir: true,
                    limit: { count: 30 },
                },
                level: 'error',
            },
        ],
    },
});
// Helper: child logger por módulo (mantém contexto consistente)
function moduleLogger(module) {
    return exports.logger.child({ module });
}

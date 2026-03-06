# LeadWatcher — Regras do Agente v3

## 🧪 Lei Fundamental: Testes Primeiro
- Nenhum módulo está concluído sem testes passando
- Crie os testes logo após implementar o service — não deixe para o final
- Se um teste falhar: leia o erro completo → identifique causa → corrija → re-execute
- Fixtures de teste ficam em `tests/fixtures/` e são reutilizadas entre testes

## 🪵 Lei dos Logs: Contexto Completo Sempre
- Use `logger` do Pino — NUNCA `console.log`
- Todo log de erro DEVE ter: module, operation, error.message, error.stack, contexto relevante
- Formato obrigatório de erro:
  logger.error({ module: 'nome', operation: 'nome-op', error: err.message, stack: err.stack, context: {...} })
- Logs de info devem ter pelo menos: module, operation, resultado principal

## 🔐 Lei da Segurança
- Credentials SEMPRE via env.ts com validação Zod — jamais hardcodado
- Todos os inputs externos validados com Zod antes de processar
- WEBHOOK_SECRET obrigatório em todas as rotas de webhook

## 📐 Lei da Qualidade
- TypeScript strict: true + noUncheckedIndexedAccess: true
- Nunca use `any` — use `unknown` com type guards
- Funções com máximo 40 linhas
- Uma responsabilidade por arquivo/classe
- async/await sempre — nunca callbacks ou .then/.catch

## 🐛 Lei do Debug
- Todo erro deve ter: código único (ERROR_CODES), mensagem clara, contexto de dados
- Erros operacionais (esperados) vs programáticos (bugs) — distinção obrigatória
- Fallbacks implementados ANTES de considerar integração externa concluída

## 📦 Nomenclatura
- Arquivos: kebab-case | Classes: PascalCase | Funções: camelCase | Constantes: UPPER_SNAKE
- Commits: `tipo(escopo): descrição` em português
- Códigos de erro: MODULO_NNN

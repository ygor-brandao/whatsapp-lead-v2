---
description: Checklist de testes
---

1. `npm run test` → todos os unitários
2. `npm run test:coverage` → verificar thresholds
3. `npm run test:integration` → testes de integração

Se falhar:
  a. Leia o erro COMPLETO com stack trace
  b. Identifique: arquivo → função → linha
  c. Corrija código ou fixture
  d. Rode novamente até verde

Só avance com 100% verde.

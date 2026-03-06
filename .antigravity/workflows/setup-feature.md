---
description: Fluxo obrigatório para nova feature
---

1. types.ts → schema Zod → repository.ts → service.ts → service.test.ts → routes.ts
2. Execute: `npm run test -- --reporter=verbose --filter=nome-do-modulo`
3. Verifique cobertura: `npm run test:coverage`
4. Se testes passaram: registre em server.ts + exporte em index.ts
5. PARE se qualquer teste falhar — corrija antes de continuar

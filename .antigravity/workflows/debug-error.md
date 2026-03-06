---
description: Investigação de erro
---

1. Copie erro completo: message + stack trace + contexto
2. Identifique: módulo → operação → linha exata
3. Verifique logs em logs/current.log ou logs/errors.log
4. Reproduza em teste unitário isolado com os dados que causaram o erro
5. Corrija com mínimo de mudanças
6. Adicione tratamento específico + log para esse caso
7. Escreva teste de regressão que previne o bug voltar
8. Documente: `// FIX(MODULO_NNN): descrição do problema e solução`

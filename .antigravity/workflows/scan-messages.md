---
description: Implementar varredura retroativa
---

1. Endpoint POST /api/v1/scan/start com body `{ targetCount: number, groupId?: string }`
2. Criar ScanJob no banco com status PENDING
3. Iniciar scanner em background (não bloquear a resposta HTTP)
4. Scanner pagina 50 mensagens por vez com delay de 500ms
5. A cada página: checar deduplicação + enfileirar na fila com prioridade 10 (baixa)
6. Atualizar ScanJob.processed a cada página (dashboard lê em realtime)
7. Ao finalizar: status DONE + found = leads encontrados
8. Teste com mock de 100 mensagens (verificar paginação e deduplicação)

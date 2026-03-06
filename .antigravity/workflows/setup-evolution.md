---
description: Setup da Evolution API em PRODUÇÃO
---

1. Acessar painel do Render → Evolution API service → verificar status "Live"
2. Testar: `curl -H "apikey: $EVOLUTION_API_KEY" https://evolution-leadwatcher.onrender.com/instance/fetchInstances`
3. Se erro 401: verificar EVOLUTION_API_KEY nas env vars do serviço no Render
4. Criar instância: `POST https://evolution-leadwatcher.onrender.com/instance/create`
   Body: `{ "instanceName": "leadwatcher", "qrcode": true }`
5. Gerar QR: `GET /instance/qrcode/leadwatcher` → escanear com WhatsApp Business
6. Validar: `GET /instance/connectionState/leadwatcher` → deve retornar `{ "state": "open" }`
7. Configurar webhook apontando para o backend em produção:
   `POST /webhook/set/leadwatcher`
   Body: `{ "url": "https://leadwatcher-backend.onrender.com/api/v1/webhook/whatsapp", "webhook_by_events": false, "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"] }`
8. Enviar mensagem de teste num grupo → verificar logs do backend no Render Dashboard
9. Confirmar que o job apareceu na fila (logs do worker BullMQ)

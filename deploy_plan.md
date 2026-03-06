# Plano de Deploy LeadWatcher

## 1. Banco de Dados (Supabase)
- Rodar `npx prisma migrate deploy`.
- Habilitar Realtime nas tabelas `Lead`, `ScanJob` e `ConnectionStatus`.

## 2. Evolution API (Render)
- Criar serviço `evolution-leadwatcher` usando imagem `atendai/evolution-api:latest`.
- Adicionar disco persistente de 1GB em `/app/instances`.
- Definir env vars de autenticação.

## 3. Backend (Render)
- Criar serviço `leadwatcher-backend`.
- Configurar todas as env vars (Supabase, Gemini, Redis, Evolution).

## 4. Dashboard (Vercel)
- Deploy do frontend apontando para o backend no Render.

## 5. Finalização
- Gerar QR Code e apresentar painel final.
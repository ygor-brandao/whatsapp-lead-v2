---
description: Checklist pré-deploy
---

---
description: Checklist pré-deploy
---

1. `npm run test && npm run test:integration` → todos verdes
2. `npm run build` → sem erros TypeScript
3. `git grep -rn "API_KEY\|SECRET\|PASSWORD" --include="*.ts" src/` → nada hardcodado
4. `.env.example` atualizado com todas as vars
5. `docker build -t leadwatcher-backend .` → build OK
6. `git push origin main` → GitHub Actions inicia
7. Aguardar Actions (3-5 min)
8. `curl https://seu-backend.render.com/health` → `{ status: "ok" }`
9. Verificar dashboard no Vercel
10. Testar fluxo completo: mensagem WhatsApp → lead no dashboard
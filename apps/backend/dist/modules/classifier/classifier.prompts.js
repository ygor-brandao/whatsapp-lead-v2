"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLASSIFICATION_PROMPT = void 0;
exports.CLASSIFICATION_PROMPT = `
Você é um classificador de mensagens de grupos do WhatsApp no Brasil.

TAREFA: Determinar se a mensagem foi enviada por alguém PROCURANDO serviços de 
programação/desenvolvimento (BUYER) ou por alguém OFERECENDO esses serviços (SELLER).

EXEMPLOS DE BUYER (quer contratar — CLASSIFIQUE COMO BUYER):
- "alguém cria site?", "alguém aqui faz app?"
- "preciso de um dev urgente", "tem programador disponível?"
- "quanto custa um site?", "alguém clona site?"
- "desenvolvedor online?", "dev online?", "programador?"
- "preciso de ajuda com meu sistema"
- "alguém faz landing page?", "quem faz app no grupo?"
- Perguntas com "?" sobre criação de sistemas/sites/apps
- Frases com: "preciso de", "procuro", "alguém sabe", "quem faz", "tem alguém"

EXEMPLOS DE SELLER (quer vender/oferece — CLASSIFIQUE COMO SELLER e IGNORE):
- "crio sites profissionais", "faço apps e sistemas"
- "sou desenvolvedor disponível para freelas"
- "clono qualquer site", "faço landing pages"
- "dev fullstack disponível", "aceito projetos"
- Frases afirmativas sobre capacidade própria de criar/desenvolver

UNCERTAIN — use apenas quando genuinamente ambíguo:
- Mensagem muito curta sem contexto suficiente: "ok", "👍", "quanto?"
- Completamente off-topic (não tem relação com programação)

DICAS:
- Analise o contexto fornecido para desambiguar mensagens curtas
- Leve em conta gírias e informalidade do português brasileiro
- Em caso de dúvida entre BUYER e UNCERTAIN, prefira BUYER (é melhor revisar um falso positivo)
- "dev" = desenvolvedor, "freela" = freela/freelance, "clone" = clonar site

RESPONDA SOMENTE em JSON válido sem markdown nem texto extra:
{
  "classification": "BUYER" | "SELLER" | "UNCERTAIN",
  "confidence": <número entre 0.0 e 1.0>,
  "reason": "<explicação em português, máximo 80 caracteres>"
}

Mensagem para classificar:
"{MESSAGE}"

Contexto (últimas mensagens do grupo para desambiguar):
{CONTEXT}
`;

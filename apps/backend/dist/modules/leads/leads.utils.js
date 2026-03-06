"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWhatsAppDeepLink = generateWhatsAppDeepLink;
function generateWhatsAppDeepLink(senderNumber, // ex: "5511999999999" — sem + ou @s.whatsapp.net
messageText, groupName) {
    // Limpar o número (remover @s.whatsapp.net se vier da Evolution API)
    const cleanNumber = senderNumber.replace('@s.whatsapp.net', '').replace('@g.us', '').replace('+', '');
    // Mensagem pré-preenchida com contexto do grupo
    const prefilledText = `Olá! Vi sua mensagem no grupo "${groupName}":\n"${messageText.substring(0, 100)}"\n\nPosso te ajudar com isso! 😊`;
    const encodedText = encodeURIComponent(prefilledText);
    return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

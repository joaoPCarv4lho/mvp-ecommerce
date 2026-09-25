import { storeConfig } from '../config/storeConfig';

export const whatsappLink = (text: string) => `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(text)}`;
export const productWhatsappText = (name: string, url: string) => `Olá! Tenho interesse em: ${name} — ${url}`;
export const pageWhatsappText = (pageName: string) => `Olá! Estou na página ${pageName} da ${storeConfig.nome} e gostaria de ajuda.`;

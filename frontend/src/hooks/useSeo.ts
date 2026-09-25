import { useEffect } from 'react';
import { storeConfig } from '../config/storeConfig';

type Seo = { title: string; description: string; path: string; image?: string; jsonLd?: object | object[]; noindex?: boolean; type?: 'website' | 'product' };

export function useSeo({ title, description, path, image = '/images/og-default-1200.webp', jsonLd, noindex, type = 'website' }: Seo) {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const url = storeConfig.siteUrl + path.split(/[?#]/)[0];
    document.title = title;
    const set = (key: 'name' | 'property', k: string, v: string) => {
      let el = document.head.querySelector(`meta[${key}="${k}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(key, k); document.head.appendChild(el); }
      el.setAttribute('content', v);
    };
    set('name', 'description', description);
    set('property', 'og:title', title);
    set('property', 'og:description', description);
    set('property', 'og:url', url);
    set('property', 'og:type', type);
    set('property', 'og:image', image.startsWith('http') ? image : storeConfig.siteUrl + image);
    set('property', 'og:locale', 'pt_BR');
    set('property', 'og:site_name', storeConfig.nome);
    set('name', 'twitter:card', 'summary_large_image');
    set('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
    link.setAttribute('href', url);
    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
    if (jsonLdText) {
      const s = document.createElement('script');
      s.type = 'application/ld+json'; s.id = 'jsonld';
      s.textContent = jsonLdText;
      document.head.appendChild(s);
    }
  }, [title, description, path, image, jsonLdText, noindex, type]);
}

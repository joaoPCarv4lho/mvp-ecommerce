import { useSeo } from '../hooks/useSeo';
import { useWhatsAppMessage } from '../hooks/useWhatsAppMessage';
import { pageWhatsappText } from '../domain/whatsapp';
import { storeJsonLd } from '../seo/jsonld';
import { storeConfig } from '../config/storeConfig';
import { CampaignBanner } from '../components/home/CampaignBanner';
import { Hero } from '../components/home/Hero';
import { Benefits } from '../components/home/Benefits';
import { NewArrivals } from '../components/home/NewArrivals';
import { PlatformHighlights } from '../components/home/PlatformHighlights';
import { GiftCardStrip } from '../components/home/GiftCardStrip';
import { Reviews } from '../components/home/Reviews';
import { StoreInfo } from '../components/home/StoreInfo';

export default function Home() {
  useSeo({
    title: storeConfig.seoTitleHome,
    description: `Loja de videogames em Joinville: consoles, jogos, usados revisados com garantia, gift cards e assistência técnica. Desde ${storeConfig.anoFundacao}.`,
    path: '/',
    jsonLd: storeJsonLd(),
  });
  useWhatsAppMessage(pageWhatsappText('Início'));

  return (
    <div>
      <CampaignBanner />
      <Hero />
      <Benefits />
      <NewArrivals />
      <PlatformHighlights />
      <GiftCardStrip />
      <Reviews />
      <StoreInfo />
    </div>
  );
}

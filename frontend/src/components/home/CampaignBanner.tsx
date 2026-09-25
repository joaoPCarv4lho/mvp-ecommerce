import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { getActiveCampaigns } from '../../services/content';

/** Only active campaigns (already filtered by the service); renders nothing when there are none. */
export function CampaignBanner() {
  const { data } = useAsync(getActiveCampaigns, []);
  if (!data?.length) return null;

  return (
    <div className="bg-brand text-white">
      <ul className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-2 text-sm">
        {data.map((c) => (
          <li key={c.id}>
            <Link to={c.href} className="font-bold hover:underline">
              {c.titulo}
            </Link>{' '}
            — {c.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}

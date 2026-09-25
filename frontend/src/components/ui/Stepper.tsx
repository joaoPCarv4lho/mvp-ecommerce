import { Link } from 'react-router-dom';

/** `hrefs[i]` turns a step into a link back to an already-completed stage (e.g. Carrinho in checkout). */
export function Stepper({ steps, current, hrefs }: { steps: string[]; current: number; hrefs?: (string | undefined)[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => {
        const href = hrefs?.[i];
        return (
          <li
            key={step}
            aria-current={i === current ? 'step' : undefined}
            className={`flex items-center gap-2 text-sm ${i === current ? 'font-bold text-brand' : 'text-muted'}`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs">{i + 1}</span>
            {href ? (
              <Link to={href} className="text-brand hover:underline">
                {step}
              </Link>
            ) : (
              <span>{step}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

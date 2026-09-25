export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, i) => (
        <li
          key={step}
          aria-current={i === current ? 'step' : undefined}
          className={`flex items-center gap-2 text-sm ${i === current ? 'font-bold text-brand' : 'text-muted'}`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs">{i + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

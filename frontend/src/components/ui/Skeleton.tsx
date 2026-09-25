export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-border ${className}`.trim()} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border p-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

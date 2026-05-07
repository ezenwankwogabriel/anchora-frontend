import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-surface-2", className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface border border-border-color rounded-xl p-5", className)}>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function HomesLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-5 w-64 mb-8" />
      <div className="grid gap-4 w-full max-w-2xl">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

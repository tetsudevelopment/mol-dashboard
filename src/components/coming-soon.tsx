import { Construction } from "lucide-react";

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <Construction
        className="size-8 text-zinc-400 dark:text-zinc-600"
        aria-hidden
      />
      <p className="text-sm font-medium">{feature} — coming soon</p>
      <p className="max-w-sm text-xs text-zinc-500">
        This module is wired up in the navigation but the views are not built yet.
      </p>
    </div>
  );
}

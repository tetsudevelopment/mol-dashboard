import Link from "next/link";
import { ArrowRight, ShieldCheck, Receipt, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Internal dashboard for testing the MOLTECH backend and mobile app."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ShortcutCard
          href="/health"
          icon={ShieldCheck}
          title="Health"
          description="Check live and ready probes of the backend in real time."
        />
        <ShortcutCard
          href="/rentals"
          icon={Receipt}
          title="Rentals"
          description="Inspect active rentals and trigger end-to-end flows."
        />
        <ShortcutCard
          href="/payments"
          icon={CreditCard}
          title="Payments"
          description="Browse payments, refunds, and simulate webhooks."
        />
      </section>

      <section className="mt-10 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          What this is
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-700 dark:text-zinc-300">
          A development dashboard that talks to{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            moltech_api
          </code>{" "}
          and mirrors what{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            moltech-app
          </code>{" "}
          does. Use it to inspect state, trigger flows, and simulate gateway
          webhooks without hitting the real payment provider.
        </p>
      </section>
    </>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      <Icon className="size-5 text-zinc-500" aria-hidden />
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <span className="mt-auto flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-50">
        Open <ArrowRight className="size-3" aria-hidden />
      </span>
    </Link>
  );
}

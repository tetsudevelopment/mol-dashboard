"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ShieldCheck,
  Users,
  MapPin,
  BatteryCharging,
  Receipt,
  CreditCard,
  Webhook,
  ScrollText,
  Megaphone,
  Target,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth.store";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Activity;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: Activity, description: "Backend status" },
  { href: "/health", label: "Health", icon: ShieldCheck, description: "Live & ready probes" },
  { href: "/users", label: "Users", icon: Users, description: "List & role management" },
  { href: "/stations", label: "Stations", icon: MapPin, description: "Gabinetes" },
  { href: "/power-banks", label: "Power Banks", icon: BatteryCharging, description: "Baterías" },
  { href: "/publicidad", label: "Publicidad", icon: Megaphone, description: "Anunciantes y anuncios" },
  { href: "/campaigns", label: "Campañas", icon: Target, description: "Campañas y asignación a gabinetes" },
  { href: "/rentals", label: "Rentals", icon: Receipt, description: "Alquileres" },
  { href: "/payments", label: "Payments", icon: CreditCard, description: "Pagos" },
  { href: "/webhooks", label: "Webhooks", icon: Webhook, description: "Simulator" },
  { href: "/audit", label: "Audit", icon: ScrollText, description: "Append-only log" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  function handleLogout() {
    clear();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <div className="size-6 rounded bg-[color:var(--brand-red)]" aria-hidden />
        <span className="text-sm font-semibold tracking-tight">MOLTECH Dashboard</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-testid={`nav-${item.href.replace(/^\//, "") || "overview"}`}
                  className={cn(
                    "group flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="flex flex-col">
                    <span className="font-medium leading-tight">{item.label}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {user ? (
        <div
          data-testid="sidebar-user"
          className="border-t border-zinc-200 p-3 text-xs dark:border-zinc-800"
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {user.first_name} {user.last_name}
            </span>
            <span className="truncate text-zinc-500">{user.email}</span>
            <span className="mt-1 inline-block w-fit rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {user.role}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            data-testid="sidebar-logout"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-300 px-2 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <LogOut className="size-3" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </aside>
  );
}

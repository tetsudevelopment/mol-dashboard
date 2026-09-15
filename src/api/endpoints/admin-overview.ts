import { z } from "zod";
import { apiClient, unwrap } from "@/api/client";
import type { ApiEnvelope } from "@/api/types";
import { PaymentSchema, type Payment } from "@/validators/payment.schema";
import { RentalSchema, type Rental } from "@/validators/rental.schema";

/**
 * Overview aggregation.
 *
 * The backend has no stats endpoint yet — there is no `/admin/stats`, and
 * neither `/admin/rentals` nor `/admin/payments` accepts a date filter. So the
 * numbers behind the Overview charts are aggregated in the browser.
 *
 * That is affordable because both lists come back newest-first (rentals by
 * `start_time desc`, payments by `attempted_at desc`, see the API's
 * rental/payment repositories), so paging stops at the first row that falls
 * outside the window instead of walking the whole table. Cost therefore scales
 * with the selected window, not with how much history has accumulated.
 *
 * When the backend grows a real `GET /admin/stats/overview?days=N`, this file
 * is the only one that has to change — `loadOverview` keeps its signature and
 * the page, hook and chart components stay as they are.
 */

/** The ceiling every admin list endpoint enforces on `page_size`. */
const PAGE_SIZE = 100;

/**
 * Hard stop so a very busy window can never turn into an unbounded request
 * loop. When it trips, the page says the numbers are partial rather than
 * quietly under-reporting.
 */
const MAX_PAGES = 30;

export const OVERVIEW_PERIODS = [7, 15, 30] as const;
export type OverviewPeriod = (typeof OVERVIEW_PERIODS)[number];

export interface DailyPoint {
  /** `YYYY-MM-DD` in the viewer's timezone. */
  date: string;
  rentals: number;
  revenue: number;
}

export interface TopStation {
  stationId: string;
  rentals: number;
}

export interface OverviewStats {
  days: OverviewPeriod;
  series: DailyPoint[];
  totals: {
    rentals: number;
    completedRentals: number;
    approvedPayments: number;
    revenue: number;
    currency: string;
  };
  topStations: TopStation[];
  /** True when MAX_PAGES was hit, i.e. the window is only partially covered. */
  truncated: boolean;
  /** Rows the dashboard schemas could not parse; excluded from every figure. */
  skipped: number;
}

interface Page<T> {
  items: T[];
  total: number;
  pageSize: number;
  skipped: number;
}

const PageMetaSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

/**
 * Rows are validated ONE BY ONE here, unlike the table endpoints which parse
 * the whole array in a single `z.array()`.
 *
 * An aggregate has to degrade, not vanish. With all-or-nothing parsing a single
 * row carrying an enum value the dashboard has not caught up with (exactly the
 * drift that broke /rentals and /payments) would blank the entire Overview —
 * charts, KPIs and ranking at once. Unparseable rows are dropped and counted so
 * the page can say so instead of showing nothing.
 */
function parseRows<T>(
  schema: z.ZodType<T>,
  raw: unknown,
): { items: T[]; skipped: number } {
  if (!Array.isArray(raw)) return { items: [], skipped: 0 };
  const items: T[] = [];
  let skipped = 0;
  for (const row of raw) {
    const parsed = schema.safeParse(row);
    if (parsed.success) items.push(parsed.data);
    else skipped += 1;
  }
  return { items, skipped };
}

async function loadListPage<T>(
  path: string,
  key: string,
  schema: z.ZodType<T>,
  page: number,
): Promise<Page<T>> {
  const raw = await unwrap(
    apiClient.get<ApiEnvelope<unknown>>(path, {
      params: { page, page_size: PAGE_SIZE },
    }),
  );
  const meta = PageMetaSchema.parse(raw);
  const { items, skipped } = parseRows(
    schema,
    (raw as Record<string, unknown>)[key],
  );
  return { items, total: meta.total, pageSize: meta.pageSize, skipped };
}

/**
 * Walks a newest-first paginated list and stops at the first row older than
 * `since`, so the number of requests is bounded by the window.
 */
async function collectSince<T>(
  loadPage: (page: number) => Promise<Page<T>>,
  timestampOf: (item: T) => string,
  since: number,
): Promise<{ rows: T[]; truncated: boolean; skipped: number }> {
  const rows: T[] = [];
  let skipped = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await loadPage(page);
    skipped += result.skipped;

    for (const item of result.items) {
      if (new Date(timestampOf(item)).getTime() < since) {
        return { rows, truncated: false, skipped };
      }
      rows.push(item);
    }

    // Uses the page size the API reports, not the parsed row count, so skipped
    // rows never make the walk stop early.
    const seen = page * result.pageSize;
    if (result.total === 0 || seen >= result.total) {
      return { rows, truncated: false, skipped };
    }
  }

  return { rows, truncated: true, skipped };
}

/** `YYYY-MM-DD` in the viewer's timezone — the bucket key for one bar. */
function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight `days - 1` days ago, so the window includes all of today. */
function windowStart(days: number): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

/**
 * A refund moves money back out, so it is subtracted rather than added.
 * Everything else that settled (`rental`, `penalty`, `extension`) is income.
 * Only `approved` rows count — a pending PSE row is not revenue until its
 * bank webhook confirms it.
 */
function signedAmount(payment: Payment): number {
  if (payment.status !== "approved") return 0;
  const amount = Number(payment.amount);
  if (!Number.isFinite(amount)) return 0;
  return payment.concept === "refund" ? -amount : amount;
}

export async function loadOverview(days: OverviewPeriod): Promise<OverviewStats> {
  const start = windowStart(days);
  const since = start.getTime();

  const [rentalsResult, paymentsResult] = await Promise.all([
    collectSince<Rental>(
      (page) => loadListPage("/admin/rentals", "rentals", RentalSchema, page),
      (rental) => rental.start_time,
      since,
    ),
    collectSince<Payment>(
      (page) => loadListPage("/admin/payments", "payments", PaymentSchema, page),
      (payment) => payment.attempted_at,
      since,
    ),
  ]);

  // Seed every day in the window so a day with no activity renders as a zero
  // bar instead of collapsing the axis and making the trend look denser than
  // it is.
  const buckets = new Map<string, DailyPoint>();
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    buckets.set(dayKey(day), { date: dayKey(day), rentals: 0, revenue: 0 });
  }

  const stationCounts = new Map<string, number>();
  let completedRentals = 0;

  for (const rental of rentalsResult.rows) {
    const bucket = buckets.get(dayKey(new Date(rental.start_time)));
    if (bucket) bucket.rentals += 1;
    if (rental.status === "completed") completedRentals += 1;
    stationCounts.set(
      rental.pickup_station_id,
      (stationCounts.get(rental.pickup_station_id) ?? 0) + 1,
    );
  }

  let revenue = 0;
  let approvedPayments = 0;
  let currency = "COP";

  for (const payment of paymentsResult.rows) {
    const amount = signedAmount(payment);
    if (payment.status === "approved") {
      approvedPayments += 1;
      currency = payment.currency;
    }
    revenue += amount;
    const bucket = buckets.get(dayKey(new Date(payment.attempted_at)));
    if (bucket) bucket.revenue += amount;
  }

  const topStations = [...stationCounts.entries()]
    .map(([stationId, rentals]) => ({ stationId, rentals }))
    .sort((a, b) => b.rentals - a.rentals)
    .slice(0, 10);

  return {
    days,
    series: [...buckets.values()],
    totals: {
      rentals: rentalsResult.rows.length,
      completedRentals,
      approvedPayments,
      revenue,
      currency,
    },
    topStations,
    truncated: rentalsResult.truncated || paymentsResult.truncated,
    skipped: rentalsResult.skipped + paymentsResult.skipped,
  };
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import NewTicketModal from "../../components/helpdesk/NewTicketModal";
import StatusBadge from "../../components/helpdesk/StatusBadge";
import { formatWhen } from "../../components/helpdesk/plainText";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { HelpdeskSummary, TicketListItem, helpdeskAPI } from "../../utils/api";

const PREVIEW_LIMIT = 4;
const DONUT_R = 54;
const DONUT_C = 2 * Math.PI * DONUT_R;

export default function Home() {
  const { hasPermission } = useAuth();
  const { t, locale } = useLanguage();
  const [summary, setSummary] = useState<HelpdeskSummary | null>(null);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCreate = hasPermission("create_ticket");
  const seesAll = hasPermission("view_all_ticket");
  const canTickets = hasPermission(["view_own_ticket", "view_all_ticket"]);
  const canKnowledge = hasPermission("view_article");

  const reload = async () => {
    const [summaryRes, ticketRes] = await Promise.all([helpdeskAPI.getSummary(), helpdeskAPI.getTickets("")]);
    if (summaryRes.success && summaryRes.data) {
      setSummary(summaryRes.data);
      setError(null);
    } else {
      setError(summaryRes.message || t("loadError"));
    }
    if (ticketRes.success && ticketRes.data) setTickets(ticketRes.data.items);
  };

  useEffect(() => {
    reload();
  }, []);

  const openCount = summary?.open ?? 0;
  const progressCount = summary?.in_progress ?? 0;
  const resolvedCount = summary?.resolved ?? 0;
  const total = summary?.total ?? 0;
  const awaiting = openCount + progressCount;
  const institutions = summary?.by_institution ?? [];
  const maxInstitution = Math.max(1, ...institutions.map((item) => item.total));

  const preview = useMemo(() => {
    const sorted = [...tickets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    if (seesAll) {
      return sorted
        .filter((item) => item.status === "open" || item.status === "in_progress")
        .slice(0, PREVIEW_LIMIT);
    }
    return sorted.slice(0, PREVIEW_LIMIT);
  }, [tickets, seesAll]);

  const statusSlices = [
    { key: "open", label: t("statusOpen"), value: openCount, color: "#2b7de0" },
    { key: "progress", label: t("statusProgress"), value: progressCount, color: "#f79009" },
    { key: "resolved", label: t("statusResolved"), value: resolvedCount, color: "#12b76a" },
  ];

  return (
    <>
      <PageMeta title={t("dashboard")} description={t("product")} />
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-sky-500 px-6 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-20 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/80">{t("dashboard")}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {seesAll ? t("queueTitle") : t("dashboardTitle")}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/85">
                {seesAll ? t("queueSubtitle") : t("dashboardSubtitle")}
              </p>
              <p className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
                {t("waitingNow", { n: awaiting })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-50"
                >
                  + {t("newTicket")}
                </button>
              )}
              {canTickets && (
                <Link
                  to="/tickets"
                  className="rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
                >
                  {seesAll ? t("manageTickets") : t("seeAll")} →
                </Link>
              )}
            </div>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900 xl:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("statusBreakdown")}</h2>
            <p className="mt-0.5 text-sm text-gray-400">{t("statusBreakdownHint")}</p>
            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <StatusDonut slices={statusSlices} total={total} centerLabel={t("ofTotal", { n: total })} />
              <ul className="w-full space-y-3">
                {statusSlices.map((slice) => (
                  <li key={slice.key} className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                      {slice.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{slice.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900 xl:col-span-3">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {seesAll ? t("institutionsAsking") : t("myRequests")}
                </h2>
                <p className="mt-0.5 text-sm text-gray-400">
                  {seesAll ? t("institutionsHint") : t("dashboardSubtitle")}
                </p>
              </div>
              {seesAll && (
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                  {summary?.institution_count ?? 0}
                </span>
              )}
            </div>

            {seesAll ? (
              institutions.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">{t("noInstitutionData")}</p>
              ) : (
                <ul className="space-y-4">
                  {institutions.slice(0, 5).map((item, index) => {
                    const width = Math.max(8, Math.round((item.total / maxInstitution) * 100));
                    const pending = item.open + item.in_progress;
                    return (
                      <li key={item.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">
                              {index + 1}
                            </span>
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-white">{item.name}</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">{item.total}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-400 transition-all duration-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          {pending > 0 ? `${pending} ${t("needsAttention").toLowerCase()}` : t("statusResolved")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : preview.length === 0 ? (
              <div className="py-10 text-center">
                <h3 className="font-medium text-gray-800 dark:text-white">{t("emptyTitle")}</h3>
                <p className="mt-1 text-sm text-gray-500">{t("emptyBody")}</p>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white"
                  >
                    + {t("submitRequest")}
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {preview.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} locale={locale} showInstitution={false} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {seesAll && (
          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("needsAttention")}</h2>
                <p className="text-sm text-gray-400">{t("needsAttentionHint")}</p>
              </div>
              {canTickets && (
                <Link
                  to="/tickets"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  {t("manageTickets")} →
                </Link>
              )}
            </div>
            {preview.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">{t("emptyTitle")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {preview.map((ticket) => {
                  const isNew = ticket.status === "open";
                  return (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className={`group flex flex-col rounded-2xl border p-4 transition-colors hover:border-brand-200 hover:bg-brand-25/40 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5 ${
                        isNew
                          ? "border-blue-100 bg-blue-50/40 dark:border-blue-500/20 dark:bg-blue-500/5"
                          : "border-amber-100 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <StatusBadge status={ticket.status} />
                        <span className="text-xs text-gray-400">{formatWhen(ticket.created_at, locale)}</span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
                        {ticket.title}
                      </p>
                      <p className="mt-2 line-clamp-1 text-xs text-gray-500">
                        {ticket.institution || ticket.requester_name || "—"}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:text-brand-700">
                        {t("handleNow")}
                        <span aria-hidden="true">→</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {canKnowledge && (
          <Link
            to="/knowledge-base"
            className="flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-25/70 px-5 py-4 text-sm hover:bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/10"
          >
            <span>
              <span className="block font-medium text-gray-900 dark:text-white">{t("needHelp")}</span>
              <span className="mt-0.5 block text-gray-500">{t("needHelpBody")}</span>
            </span>
            <span className="font-medium text-brand-600">{t("openGuide")} ›</span>
          </Link>
        )}
      </div>

      <NewTicketModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          reload();
        }}
      />
    </>
  );
}

function StatusDonut({
  slices,
  total,
  centerLabel,
}: {
  slices: { key: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}) {
  const safeTotal = total > 0 ? total : 1;
  let offset = 0;
  const arcs = slices.map((slice) => {
    const length = (slice.value / safeTotal) * DONUT_C;
    const item = { ...slice, length, offset };
    offset += length;
    return item;
  });

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={DONUT_R} fill="none" stroke="#eef2f7" strokeWidth="16" />
        {total === 0 ? null : (
          arcs.map((arc) => (
            <circle
              key={arc.key}
              cx="70"
              cy="70"
              r={DONUT_R}
              fill="none"
              stroke={arc.color}
              strokeWidth="16"
              strokeDasharray={`${arc.length} ${DONUT_C - arc.length}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
            />
          ))
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{total}</span>
        <span className="mt-0.5 px-2 text-center text-[11px] leading-tight text-gray-400">{centerLabel}</span>
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  locale,
  showInstitution,
}: {
  ticket: TicketListItem;
  locale: "id" | "en";
  showInstitution: boolean;
}) {
  return (
    <li>
      <Link to={`/tickets/${ticket.id}`} className="flex items-start justify-between gap-4 py-3.5 hover:opacity-90">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white">{ticket.title}</p>
          <p className="mt-1 truncate text-sm text-gray-500">
            {showInstitution
              ? ticket.institution || ticket.requester_name || "—"
              : ticket.category_name || ticket.service_name}
            <span className="px-1.5 text-gray-300">·</span>
            {formatWhen(ticket.created_at, locale)}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </Link>
    </li>
  );
}

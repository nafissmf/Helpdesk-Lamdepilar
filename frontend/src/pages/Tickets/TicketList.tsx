import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import NewTicketModal from "../../components/helpdesk/NewTicketModal";
import StatusBadge from "../../components/helpdesk/StatusBadge";
import { formatWhen } from "../../components/helpdesk/plainText";
import { ConfirmModal } from "../../components/ui/modal/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { EyeIcon, TrashBinIcon } from "../../icons";
import { TicketListItem, helpdeskAPI } from "../../utils/api";

const PAGE_SIZE = 8;

type Tab = "all" | "in_progress" | "resolved";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Split "Univ — Jurusan" (or en/em dash / hyphen) into two lines. */
function splitInstitution(raw: string | null | undefined): { univ: string; jurusan: string | null } {
  const value = (raw || "").trim();
  if (!value) return { univ: "—", jurusan: null };
  const parts = value.split(/\s*[—–−-]\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { univ: parts[0], jurusan: parts.slice(1).join(" — ") };
  }
  return { univ: value, jurusan: null };
}

function localDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function TicketList() {
  const { hasPermission } = useAuth();
  const { t, locale } = useLanguage();
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<TicketListItem[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const seesAll = hasPermission("view_all_ticket");
  const canDelete = hasPermission("delete_ticket");
  const title = seesAll ? t("allTickets") : t("myTickets");

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await helpdeskAPI.deleteTicket(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (!res.success) {
      toastError(res.message || t("loadError"));
      return;
    }
    success(t("ticketDeleted"));
    await load();
  };

  const load = async () => {
    const res = await helpdeskAPI.getTickets("");
    if (res.success && res.data) setItems(res.data.items);
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.service_name).filter(Boolean))).sort(),
    [items],
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      in_progress: items.filter((item) => item.status === "in_progress").length,
      resolved: items.filter((item) => item.status === "resolved").length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = items.filter((item) => {
      if (tab !== "all" && item.status !== tab) return false;
      if (category && item.service_name !== category) return false;
      if (date && localDay(item.created_at) !== date) return false;
      if (q && !item.title.toLowerCase().includes(q)) return false;
      return true;
    });
    next.sort((a, b) => {
      const delta = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "newest" ? -delta : delta;
    });
    return next;
  }, [items, tab, category, date, query, sort]);

  useEffect(() => {
    setPage(1);
  }, [tab, category, date, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = (safePage - 1) * PAGE_SIZE + visible.length;
  const rangeLabel = from === to ? String(from) : `${from}–${to}`;

  const tabs: { id: Tab; label: string; count: number; tone: string }[] = [
    { id: "all", label: t("tabAll"), count: counts.all, tone: "bg-brand-500 text-white" },
    { id: "in_progress", label: t("inProgress"), count: counts.in_progress, tone: "bg-amber-100 text-amber-700" },
    { id: "resolved", label: t("resolved"), count: counts.resolved, tone: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <>
      <PageMeta title={title} description={t("product")} />
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400">
              {t("breadcrumbService")}
              <span className="px-1.5">›</span>
              <span className="text-gray-500">{title}</span>
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {seesAll ? t("ticketListSubtitle") : t("dashboardSubtitle")}
            </p>
          </div>
          {hasPermission("create_ticket") && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
            >
              <span className="text-base leading-none">+</span>
              {t("newTicket")}
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label={t("totalTickets")}
            value={counts.all}
            tone="bg-blue-50 text-blue-600"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8M8 11h8M8 15h5M6 3h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 012-2z" />
              </svg>
            }
          />
          <StatCard
            label={t("inProgress")}
            value={counts.in_progress}
            tone="bg-amber-50 text-amber-600"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l2.5 2.5M12 21a9 9 0 100-18 9 9 0 000 18z" />
              </svg>
            }
          />
          <StatCard
            label={t("resolved")}
            value={counts.resolved}
            tone="bg-emerald-50 text-emerald-600"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex gap-6 border-b border-gray-100 px-5 pt-2 dark:border-gray-800">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm ${
                    active
                      ? "border-brand-500 font-medium text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {item.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${active ? item.tone : "bg-gray-100 text-gray-500"}`}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:flex-wrap sm:items-center dark:border-gray-800">
            <label className="relative min-w-0 flex-1 sm:min-w-[14rem]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                </svg>
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchByTitle")}
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/80 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 min-w-[10.5rem] appearance-none rounded-lg border border-gray-200 bg-gray-50/80 bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat py-0 pl-3 pr-9 text-sm text-gray-600 outline-none transition focus:border-brand-300 focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
              }}
            >
              <option value="">{t("allCategories")}</option>
              {categories.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={t("pickDate")}
              className={`h-10 min-w-[10.5rem] rounded-lg border border-gray-200 bg-gray-50/80 px-3 text-sm outline-none transition focus:border-brand-300 focus:bg-white dark:border-gray-700 dark:bg-gray-900 ${
                date ? "text-gray-700 dark:text-gray-200" : "text-gray-400"
              }`}
            />
            <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 pl-3 pr-1 text-sm text-gray-500 transition focus-within:border-brand-300 focus-within:bg-white dark:border-gray-700 dark:bg-gray-900">
              <span className="shrink-0 whitespace-nowrap">{t("sortLabel")}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
                aria-label={t("sortLabel")}
                className="h-full min-w-[6.5rem] appearance-none border-0 bg-transparent bg-[length:1rem] bg-[right_0.4rem_center] bg-no-repeat py-0 pl-1 pr-7 font-medium text-gray-700 outline-none dark:text-gray-200"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                }}
              >
                <option value="newest">{t("sortNewest")}</option>
                <option value="oldest">{t("sortOldest")}</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:bg-gray-900/50">
                  <th className="px-5 py-3 font-semibold">{t("ticketSubject")}</th>
                  <th className="px-3 py-3 font-semibold">{seesAll ? t("institution") : t("applicant")}</th>
                  <th className="px-3 py-3 font-semibold">{t("categoryColumn")}</th>
                  <th className="whitespace-nowrap px-3 py-3 font-semibold">{t("date")}</th>
                  <th className="px-3 py-3 font-semibold">{t("status")}</th>
                  <th className="w-24 px-4 py-3 text-right font-semibold">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-500">{t("emptyTitle")}</td>
                  </tr>
                ) : (
                  visible.map((ticket) => {
                    const name = ticket.requester_name || "—";
                    const { univ } = splitInstitution(ticket.institution);
                    const jurusan = ticket.study_program?.trim() || null;
                    return (
                      <tr
                        key={ticket.id}
                        className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                      >
                        <td className="max-w-[18rem] px-5 py-3.5">
                          <Link
                            to={`/tickets/${ticket.id}`}
                            className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                            title={ticket.title}
                          >
                            {ticket.title}
                          </Link>
                        </td>
                        <td className="min-w-[11rem] max-w-[16rem] px-3 py-3.5">
                          {seesAll ? (
                            <span className="block min-w-0" title={[univ, jurusan].filter(Boolean).join(" — ")}>
                              <span className="block truncate text-sm font-medium leading-snug text-gray-800 dark:text-white">
                                {univ}
                              </span>
                              {jurusan && (
                                <span className="mt-0.5 block truncate text-xs leading-snug text-gray-500 dark:text-gray-400">
                                  {jurusan}
                                </span>
                              )}
                              <span className="mt-0.5 block truncate text-[11px] leading-snug text-gray-400">
                                {name}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                                {name === "—" ? "—" : initials(name)}
                              </span>
                              <span className="truncate">{name}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="inline-flex max-w-[10rem] truncate rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                            {ticket.service_name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-500">
                          {formatWhen(ticket.created_at, locale)}
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-800 dark:hover:bg-brand-950/40"
                              title={t("viewDetail")}
                              aria-label={t("viewDetail")}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleteId(ticket.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-red-900/60 dark:hover:bg-red-950/40"
                                title={t("deleteTicket")}
                                aria-label={t("deleteTicket")}
                              >
                                <TrashBinIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              {filtered.length === 0
                ? t("showingTickets", { label: "0", total: 0 })
                : t("showingTickets", { label: rangeLabel, total: filtered.length })}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40"
                aria-label="Previous"
              >
                ‹
              </button>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-brand-500 px-2 text-sm font-medium text-white">
                {safePage}
              </span>
              <button
                type="button"
                disabled={safePage >= pageCount}
                onClick={() => setPage(safePage + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40"
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {hasPermission("view_article") && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.5v11m0-11c-1.5-1-3.5-1.5-6-1.5v11c2.5 0 4.5.5 6 1.5m0-11c1.5-1 3.5-1.5 6-1.5v11c-2.5 0-4.5.5-6 1.5" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("needHelp")}</p>
                <p className="text-sm text-gray-500">{t("needHelpBody")}</p>
              </div>
            </div>
            <Link to="/knowledge-base" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              {t("openGuide")} <span aria-hidden="true">›</span>
            </Link>
          </div>
        )}
      </div>
      <NewTicketModal open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); load(); }} />
      <ConfirmModal
        isOpen={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t("deleteTicketTitle")}
        message={t("deleteTicketBody")}
        confirmText={t("deleteTicketConfirm")}
        cancelText={t("cancel")}
        confirmButtonColor="danger"
        isLoading={deleting}
      />
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}>{icon}</span>
      <span>
        <span className="block text-sm text-gray-500">{label}</span>
        <span className="block text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</span>
      </span>
    </div>
  );
}

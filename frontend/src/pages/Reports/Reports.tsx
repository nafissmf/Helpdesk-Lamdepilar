import { useEffect, useMemo, useState, type ReactNode } from "react";
import PageMeta from "../../components/common/PageMeta";
import { formatWhen } from "../../components/helpdesk/plainText";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { ReportData, helpdeskAPI } from "../../utils/api";

const ranges = [7, 30, 90] as const;
const CHART_H = 168;

export default function Reports() {
  const { hasPermission } = useAuth();
  const { t, locale } = useLanguage();
  const { error } = useToast();
  const [range, setRange] = useState<(typeof ranges)[number]>(30);
  const [data, setData] = useState<ReportData | null>(null);
  const seesAll = hasPermission("view_all_report");
  const canExport = seesAll ? hasPermission("export_all_report") : hasPermission("export_own_report");

  const load = async (next = range) => {
    const res = await helpdeskAPI.getReport(next);
    if (res.success && res.data) setData(res.data);
    else error(res.message || t("loadError"));
  };

  useEffect(() => {
    load(range);
  }, [range]);

  const weeks = data?.weeks ?? [];
  const categories = useMemo(
    () => [...(data?.categories ?? [])].sort((a, b) => b.count - a.count),
    [data?.categories],
  );
  const createdTotal = weeks.reduce((sum, week) => sum + week.created, 0);
  const resolvedTotal = weeks.reduce((sum, week) => sum + week.resolved, 0);
  const max = Math.max(1, ...weeks.flatMap((week) => [week.created, week.resolved]));
  const categoryMax = Math.max(1, ...categories.map((row) => row.count));
  const hasCategory = categories.length > 0;
  const hasWeekData = weeks.some((week) => week.created > 0 || week.resolved > 0);

  const barPx = (value: number) => {
    if (value <= 0) return 0;
    return Math.max(8, Math.round((value / max) * CHART_H));
  };

  return (
    <>
      <PageMeta title={seesAll ? t("reportAllTitle") : t("reportTitle")} description={t("reports")} />
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {seesAll ? t("reportAllTitle") : t("reportTitle")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("updatedOn", { date: formatWhen(data?.updated_at, locale) })}
            </p>
          </div>
          {canExport && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => helpdeskAPI.exportReportExcel(range)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:bg-white/[0.07]"
              >
                {t("exportExcel")}
              </button>
              <button
                type="button"
                onClick={() => helpdeskAPI.exportReportPdf(range)}
                className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 dark:bg-brand-600/90 dark:hover:bg-brand-500"
              >
                {t("exportPdf")}
              </button>
            </div>
          )}
        </div>

        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#1a1e27]">
          {ranges.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`rounded-lg px-3.5 py-2 text-sm transition ${
                range === item
                  ? "bg-brand-500 font-medium text-white shadow-sm dark:bg-brand-600/90 dark:shadow-none"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-200"
              }`}
            >
              {item === 7 ? t("last7") : item === 30 ? t("last30") : t("last90")}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label={t("totalTickets")}
            value={data?.total ?? 0}
            hint={t("ticketsInPeriod", { n: data?.total ?? 0 })}
            tone="bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-300"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8M8 11h8M8 15h5M6 3h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 012-2z" />
              </svg>
            }
          />
          <StatCard
            label={t("created")}
            value={createdTotal}
            hint={t("volumeHint")}
            tone="bg-brand-50 text-brand-600 dark:bg-rose-500/10 dark:text-rose-300/90"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <StatCard
            label={t("resolved")}
            value={resolvedTotal}
            hint={t("categoryHint")}
            tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300/90"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#1a1e27] dark:shadow-none xl:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("ticketVolume")}</h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t("volumeHint")}</p>
              </div>
              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand-500 dark:bg-rose-400/80" />
                  {t("created")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400/80" />
                  {t("resolved")}
                </span>
              </div>
            </div>

            {hasWeekData ? (
              <div className="mt-5">
                <div className="relative rounded-xl bg-gray-50/70 px-1 pt-2 dark:bg-white/[0.03]" style={{ height: CHART_H + 8 }}>
                  <div className="pointer-events-none absolute inset-x-1 inset-y-2 flex flex-col justify-between">
                    {[0, 1, 2, 3].map((line) => (
                      <div key={line} className="border-t border-dashed border-gray-200/80 dark:border-white/[0.06]" />
                    ))}
                  </div>
                  <div className="absolute inset-x-1 bottom-2 top-2 flex items-end gap-2 sm:gap-3">
                    {weeks.map((week) => (
                      <div key={week.label} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                        <div className="flex w-full items-end justify-center gap-1" style={{ height: CHART_H }}>
                          <div
                            className="w-2.5 rounded-t-md bg-brand-500 dark:bg-rose-400/75 sm:w-3"
                            style={{ height: barPx(week.created) }}
                            title={`${t("created")}: ${week.created}`}
                          />
                          <div
                            className="w-2.5 rounded-t-md bg-emerald-500 dark:bg-emerald-400/75 sm:w-3"
                            style={{ height: barPx(week.resolved) }}
                            title={`${t("resolved")}: ${week.resolved}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex gap-2 border-t border-gray-100 pt-2 dark:border-white/[0.06] sm:gap-3">
                  {weeks.map((week) => (
                    <div key={`${week.label}-lbl`} className="min-w-0 flex-1 text-center">
                      <p className="truncate text-[10px] leading-tight text-gray-500 dark:text-gray-400 sm:text-[11px]">
                        {formatWeekLabel(week.label, locale)}
                      </p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
                        {week.created}/{week.resolved}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-10 text-center text-sm text-gray-400 dark:text-gray-500">{t("noPeriodData")}</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#1a1e27] dark:shadow-none xl:col-span-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("categoryBreakdown")}</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t("categoryHint")}</p>
            {hasCategory ? (
              <ul className="mt-4 space-y-3.5">
                {categories.map((row) => (
                  <li key={row.name}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-gray-700 dark:text-gray-300">{row.name}</span>
                      <span className="shrink-0 tabular-nums font-semibold text-gray-900 dark:text-gray-100">{row.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-brand-500/80 dark:bg-rose-400/60"
                        style={{ width: `${Math.max(6, (row.count / categoryMax) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-10 text-center text-sm text-gray-400 dark:text-gray-500">{t("noPeriodData")}</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function formatWeekLabel(label: string, locale: "id" | "en") {
  const match = label.match(/^([A-Za-z]{3})(\d{1,2}).*?([A-Za-z]{3})?(\d{1,2})$/);
  if (!match) return label;
  const [, m1, d1, m2, d2] = match;
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const map = locale === "id" ? monthsId : monthsEn;
  const i1 = monthsEn.findIndex((m) => m.toLowerCase() === m1.toLowerCase());
  const i2 = m2 ? monthsEn.findIndex((m) => m.toLowerCase() === m2.toLowerCase()) : i1;
  const a = i1 >= 0 ? map[i1] : m1;
  const b = i2 >= 0 ? map[i2] : m2 || m1;
  if (!m2 || m1.toLowerCase() === (m2 || "").toLowerCase()) {
    return `${d1}–${d2} ${a}`;
  }
  return `${d1} ${a}–${d2} ${b}`;
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-white/8 dark:bg-[#1a1e27] dark:shadow-none">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
          <p className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-100">{value}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        </div>
      </div>
    </div>
  );
}

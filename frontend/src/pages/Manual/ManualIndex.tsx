import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ManualEditorModal from "../../components/helpdesk/ManualEditorModal";
import { toPlainSnippet } from "../../components/helpdesk/plainText";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { ManualItem, helpdeskAPI } from "../../utils/api";

const CARD_COLORS = ["#2B7DE0", "#0E9F6E", "#F79009", "#7C3AED", "#F04438", "#667085"];

export default function ManualIndex() {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_manual");
  const [items, setItems] = useState<ManualItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManualItem | null>(null);

  const load = async () => {
    const res = await helpdeskAPI.getManualIndex();
    if (res.success && res.data) setItems(res.data.items);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.body || "").toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <>
      <PageMeta title={t("manualTitle")} description={t("manual")} />
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{t("manualTitle")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("manualSubtitle")}</p>
            <p className="mt-2 text-xs text-gray-400">{t("manualCount", { n: filtered.length })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                </svg>
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchManual")}
                className="h-11 w-56 rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
                className="h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
              >
                + {t("newManual")}
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white px-5 py-14 text-center shadow-sm dark:bg-gray-900">
            <p className="text-sm text-gray-500">{t("noManual")}</p>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
                className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white"
              >
                + {t("newManual")}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((page, index) => (
              <article
                key={page.id}
                className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 dark:ring-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }}
                    aria-hidden="true"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M9 12h6m-6 4h6M7 4h7l3 3v13a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z"
                      />
                    </svg>
                  </span>
                  {page.has_pdf && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                      {t("manualPdfOnly")}
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-base font-semibold leading-snug text-gray-900 dark:text-white">
                  {page.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-gray-500">
                  {page.body?.trim()
                    ? toPlainSnippet(page.body, 110)
                    : page.pdf_file_name || t("manualPdfPreview")}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <Link
                    to={`/manual/${page.slug}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    {t("openManual")} →
                  </Link>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(page);
                        setOpen(true);
                      }}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      {t("editManual")}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ManualEditorModal
        open={open}
        page={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={() => load()}
      />
    </>
  );
}

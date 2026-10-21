import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ArticleEditorModal from "../../components/helpdesk/ArticleEditorModal";
import { toPlainSnippet } from "../../components/helpdesk/plainText";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { ArticleItem, helpdeskAPI } from "../../utils/api";

export default function KnowledgeBase() {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_article");
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ArticleItem | null>(null);

  const load = async (q = query) => {
    const res = await helpdeskAPI.getArticles(q);
    if (!res.success || !res.data) return;
    const next = canManage ? res.data.items : res.data.items.filter((item) => item.status === "published");
    setItems(next);
  };

  useEffect(() => {
    load("");
  }, [canManage]);

  const publishedCount = items.filter((item) => item.status === "published").length;
  const draftCount = items.length - publishedCount;

  return (
    <>
      <PageMeta title={t("knowledgeTitle")} description={t("knowledge")} />
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{t("knowledgeTitle")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("knowledgeSubtitle")}</p>
            <p className="mt-2 text-xs text-gray-400">
              {canManage
                ? `${publishedCount} ${t("articlePublished").toLowerCase()}${draftCount > 0 ? ` · ${draftCount} ${t("articleDraft").toLowerCase()}` : ""}`
                : t("publishedCount", { n: items.length })}
            </p>
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
                onChange={(e) => {
                  setQuery(e.target.value);
                  load(e.target.value);
                }}
                placeholder={t("searchArticles")}
                className="h-11 w-56 rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-300 dark:border-white/10 dark:bg-[#1a1e27] dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </label>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
                className="h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                + {t("newArticle")}
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl bg-white px-5 py-14 text-center shadow-sm dark:bg-[#1a1e27] dark:ring-1 dark:ring-white/8">
            <p className="text-sm text-gray-500">{t("noArticles")}</p>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
                className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white"
              >
                + {t("newArticle")}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((article) => (
              <article
                key={article.id}
                className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[#1a1e27] dark:ring-white/8 dark:shadow-none dark:hover:ring-white/12"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white dark:opacity-85"
                    style={{ backgroundColor: article.card_color || "#2B7DE0" }}
                    aria-hidden="true"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.5c-1.8-1.2-4.2-1.5-7-.8v12.2c2.8-.7 5.2-.4 7 .8 1.8-1.2 4.2-1.5 7-.8V5.7c-2.8-.7-5.2-.4-7 .8z" />
                    </svg>
                  </span>
                  <span className="flex flex-wrap items-center justify-end gap-1.5">
                    {article.has_pdf && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                        {t("articlePdf")}
                      </span>
                    )}
                    {canManage && article.status === "draft" && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        {t("articleDraft")}
                      </span>
                    )}
                  </span>
                </div>

                <h2 className="mt-4 text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
                  {article.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {toPlainSnippet(article.body, 110)}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/8">
                  <Link
                    to={`/knowledge-base/${article.id}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400/90 dark:hover:text-brand-300"
                  >
                    {t("openArticle")} →
                  </Link>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(article);
                        setOpen(true);
                      }}
                      className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {t("editArticle")}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ArticleEditorModal
        open={open}
        article={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={() => load(query)}
      />
    </>
  );
}

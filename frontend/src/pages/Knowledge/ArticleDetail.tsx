import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ArticleEditorModal from "../../components/helpdesk/ArticleEditorModal";
import MarkdownView from "../../components/helpdesk/MarkdownView";
import { ConfirmModal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { ArticleItem, helpdeskAPI } from "../../utils/api";

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { success, error } = useToast();
  const canManage = hasPermission("manage_article");
  const [article, setArticle] = useState<ArticleItem | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    const res = await helpdeskAPI.getArticle(Number(id));
    if (res.success && res.data) setArticle(res.data);
  };

  useEffect(() => {
    load();
  }, [id]);

  const remove = async () => {
    if (!article) return;
    setDeleting(true);
    const res = await helpdeskAPI.deleteArticle(article.id);
    setDeleting(false);
    if (!res.success) {
      error(res.message || t("loadError"));
      return;
    }
    setConfirmOpen(false);
    success(t("articleDeleted"));
    navigate("/knowledge-base");
  };

  if (!article) return null;
  return (
    <>
      <PageMeta title={article.title} description={t("knowledge")} />
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Breadcrumb">
            <Link
              to="/knowledge-base"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("knowledge")}
            </Link>
            <svg
              className="hidden h-4 w-4 text-gray-300 sm:block dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
            </svg>
            <span
              className="hidden max-w-[240px] truncate text-sm text-gray-500 sm:inline dark:text-gray-400"
              title={article.title}
            >
              {article.title}
            </span>
          </nav>
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 3.5a2.121 2.121 0 113 3L12 16l-4 1 1-4 9.5-9.5z"
                  />
                </svg>
                {t("editArticle")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 text-sm font-medium text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-900 dark:hover:bg-red-950/40"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"
                  />
                </svg>
                {t("deleteArticle")}
              </button>
            </div>
          )}
        </div>

        <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-8 dark:bg-gray-900">
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: article.card_color || "#2B7DE0" }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 6.5c-1.8-1.2-4.2-1.5-7-.8v12.2c2.8-.7 5.2-.4 7 .8 1.8-1.2 4.2-1.5 7-.8V5.7c-2.8-.7-5.2-.4-7 .8z"
                />
              </svg>
            </span>
            {canManage && article.status === "draft" && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                {t("articleDraft")}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{article.title}</h1>
          {article.body?.trim() && (
            <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
              <MarkdownView source={article.body} />
            </div>
          )}
          {article.has_pdf && (
            <div className={`${article.body?.trim() ? "mt-6" : "mt-5 border-t border-gray-100 pt-5 dark:border-gray-800"}`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("articlePdfPreview")}
                  {article.pdf_file_name ? ` · ${article.pdf_file_name}` : ""}
                </p>
                <a
                  href={`/api/v1/articles/${article.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  {t("openPdf")}
                </a>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                <iframe
                  title={t("articlePdfPreview")}
                  src={`/api/v1/articles/${article.id}/pdf`}
                  className="h-[480px] w-full"
                />
              </div>
            </div>
          )}
        </article>
      </div>

      <ArticleEditorModal
        open={open}
        article={article}
        onClose={() => setOpen(false)}
        onSaved={(next) => setArticle(next)}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        onConfirm={remove}
        title={t("deleteArticleTitle")}
        message={t("deleteArticleBody")}
        confirmText={t("deleteArticleConfirm")}
        cancelText={t("cancel")}
        confirmButtonColor="danger"
        isLoading={deleting}
        icon={
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"
            />
          </svg>
        }
      >
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: article.card_color || "#2B7DE0" }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 6.5c-1.8-1.2-4.2-1.5-7-.8v12.2c2.8-.7 5.2-.4 7 .8 1.8-1.2 4.2-1.5 7-.8V5.7c-2.8-.7-5.2-.4-7 .8z"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{article.title}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {article.status === "draft" ? t("articleDraft") : t("articlePublished")}
              </p>
            </div>
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ManualEditorModal from "../../components/helpdesk/ManualEditorModal";
import MarkdownView from "../../components/helpdesk/MarkdownView";
import { ConfirmModal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { ManualItem, helpdeskAPI } from "../../utils/api";

export default function ManualArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { success, error } = useToast();
  const canManage = hasPermission("manage_manual");
  const [page, setPage] = useState<ManualItem | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!slug) return;
    const res = await helpdeskAPI.getManual(slug);
    if (res.success && res.data) setPage(res.data);
  };

  useEffect(() => {
    load();
  }, [slug]);

  const remove = async () => {
    if (!page) return;
    setDeleting(true);
    const res = await helpdeskAPI.deleteManual(page.id);
    setDeleting(false);
    if (!res.success) {
      error(res.message || t("loadError"));
      return;
    }
    setConfirmOpen(false);
    success(t("manualDeleted"));
    navigate("/manual");
  };

  if (!page) return null;
  const pdfUrl = page.has_pdf ? `/api/v1/manual/${page.id}/pdf` : null;

  return (
    <>
      <PageMeta title={page.title} description={t("manual")} />
      <div className={`mx-auto ${pdfUrl ? "max-w-5xl" : "max-w-3xl"}`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Breadcrumb">
            <Link
              to="/manual"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("backManual")}
            </Link>
            <svg className="hidden h-4 w-4 text-gray-300 sm:block dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
            </svg>
            <span className="hidden max-w-[240px] truncate text-sm text-gray-500 sm:inline dark:text-gray-400" title={page.title}>
              {page.title}
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
                {t("editManual")}
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
                {t("deleteManual")}
              </button>
            </div>
          )}
        </div>

        <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-8 dark:bg-gray-900">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white">
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
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
                {t("manualPdfOnly")}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{page.title}</h1>
          {page.body?.trim() && (
            <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
              <MarkdownView source={page.body} />
            </div>
          )}
          {pdfUrl && (
            <div className={`${page.body?.trim() ? "mt-6" : "mt-5"} border-t border-gray-100 pt-5 dark:border-gray-800`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {page.pdf_file_name || t("manualPdfPreview")}
                </p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  {t("openPdf")} ↗
                </a>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                <iframe title={page.title} src={pdfUrl} className="h-[70vh] min-h-[420px] w-full" />
              </div>
            </div>
          )}
        </article>
      </div>

      <ManualEditorModal
        open={open}
        page={page}
        onClose={() => setOpen(false)}
        onSaved={(next) => {
          setPage(next);
          if (next.slug !== slug) navigate(`/manual/${next.slug}`, { replace: true });
        }}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        onConfirm={remove}
        title={t("deleteManualTitle")}
        message={t("deleteManualBody")}
        confirmText={t("deleteManualConfirm")}
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
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12h6m-6 4h6M7 4h7l3 3v13a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{page.title}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">/{page.slug}</p>
              {page.has_pdf && (
                <span className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {t("manualPdfOnly")}
                  {page.pdf_file_name ? ` · ${page.pdf_file_name}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}

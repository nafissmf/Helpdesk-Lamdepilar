import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { ManualItem, helpdeskAPI } from "../../utils/api";

interface Props {
  open: boolean;
  page?: ManualItem | null;
  onClose: () => void;
  onSaved: (page: ManualItem) => void;
}

export default function ManualEditorModal({ open, page, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [existingPdf, setExistingPdf] = useState(false);
  const [removePdf, setRemovePdf] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(page?.title || "");
    setBody(page?.body || "");
    setSlug(page?.slug || "");
    setSortOrder(page?.sort_order ?? 0);
    setPdfFile(null);
    setRemovePdf(false);
    setExistingPdf(Boolean(page?.has_pdf));
  }, [open, page]);

  useEffect(() => {
    if (!pdfFile) {
      setPdfPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pdfFile);
    setPdfPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfFile]);

  const savedPdfUrl = page?.id && existingPdf && !removePdf && !pdfFile
    ? `/api/v1/manual/${page.id}/pdf`
    : null;
  const previewSrc = pdfPreviewUrl || savedPdfUrl;

  const onPickPdf = (file: File | null) => {
    if (!file) {
      setPdfFile(null);
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      error(t("manualPdf"));
      return;
    }
    setPdfFile(file);
    setRemovePdf(false);
  };

  const save = async () => {
    const hasPdf = Boolean(pdfFile) || (existingPdf && !removePdf);
    if (!title.trim() || (!body.trim() && !hasPdf)) {
      error(t("manualPdfOrBody"));
      return;
    }
    setSaving(true);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("body", body.trim());
    form.set("slug", slug.trim());
    form.set("sort_order", String(sortOrder || 0));
    if (pdfFile) form.set("pdf", pdfFile);
    if (page && removePdf && !pdfFile) form.set("remove_pdf", "true");
    const res = page
      ? await helpdeskAPI.updateManual(page.id, form)
      : await helpdeskAPI.createManual(form);
    setSaving(false);
    if (!res.success || !res.data) {
      error(res.message || t("loadError"));
      return;
    }
    success(t("manualSaved"));
    onSaved(res.data);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-3xl m-4">
      <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {page ? t("editManual") : t("newManual")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{t("manualModalSubtitle")}</p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("title")}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder={t("titlePlaceholder")}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("manualBody")}</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder={t("manualBodyPlaceholder")}
            />
            <span className="mt-1 block text-xs text-gray-400">{t("manualPdfOrBody")}</span>
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("manualPdf")}</span>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-600">
              <span>
                {pdfFile?.name ||
                  (!removePdf && page?.pdf_file_name) ||
                  t("manualPdfHint")}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => onPickPdf(e.target.files?.[0] || null)}
              />
            </label>
            {(pdfFile || (existingPdf && !removePdf)) && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null);
                    if (existingPdf) setRemovePdf(true);
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {t("manualPdfRemove")}
                </button>
              </div>
            )}
          </div>

          {previewSrc && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("manualPdfPreview")}
              </span>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                <iframe title={t("manualPdfPreview")} src={previewSrc} className="h-[360px] w-full" />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="otomatis-dari-judul"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("manualSortOrder")}</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {t("saveManual")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

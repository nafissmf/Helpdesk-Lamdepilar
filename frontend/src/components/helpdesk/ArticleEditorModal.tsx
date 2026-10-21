import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { ArticleItem, helpdeskAPI } from "../../utils/api";

const COLORS = ["#2B7DE0", "#7C3AED", "#12B76A", "#F79009", "#F04438", "#667085"];

interface Props {
  open: boolean;
  article?: ArticleItem | null;
  onClose: () => void;
  onSaved: (article: ArticleItem) => void;
}

export default function ArticleEditorModal({ open, article, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("published");
  const [cardColor, setCardColor] = useState(COLORS[0]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [existingPdf, setExistingPdf] = useState(false);
  const [removePdf, setRemovePdf] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(article?.title || "");
    setBody(article?.body || "");
    setStatus(article?.status || "published");
    setCardColor(article?.card_color || COLORS[0]);
    setPdfFile(null);
    setRemovePdf(false);
    setExistingPdf(Boolean(article?.has_pdf));
  }, [open, article]);

  useEffect(() => {
    if (!pdfFile) {
      setPdfPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pdfFile);
    setPdfPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfFile]);

  const savedPdfUrl =
    article?.id && existingPdf && !removePdf && !pdfFile
      ? `/api/v1/articles/${article.id}/pdf`
      : null;
  const previewSrc = pdfPreviewUrl || savedPdfUrl;

  const onPickPdf = (file: File | null) => {
    if (!file) {
      setPdfFile(null);
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      error(t("articlePdf"));
      return;
    }
    setPdfFile(file);
    setRemovePdf(false);
  };

  const save = async () => {
    const hasPdf = Boolean(pdfFile) || (existingPdf && !removePdf);
    if (!title.trim() || (!body.trim() && !hasPdf)) {
      error(t("articlePdfOrBody"));
      return;
    }
    setSaving(true);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("body", body.trim());
    form.set("status", status);
    form.set("card_color", cardColor);
    if (pdfFile) form.set("pdf", pdfFile);
    if (article && removePdf && !pdfFile) form.set("remove_pdf", "true");
    const res = article
      ? await helpdeskAPI.updateArticle(article.id, form)
      : await helpdeskAPI.createArticle(form);
    setSaving(false);
    if (!res.success || !res.data) {
      error(res.message || t("loadError"));
      return;
    }
    success(t("articleSaved"));
    onSaved(res.data);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-3xl m-4">
      <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {article ? t("editArticle") : t("newArticle")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("articleModalSubtitle")}</p>

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
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("articleBody")}</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder={t("articleBodyPlaceholder")}
            />
            <span className="mt-1 block text-xs text-gray-400">{t("articlePdfOrBody")}</span>
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("articlePdf")}</span>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
              <span>
                {pdfFile?.name ||
                  (!removePdf && article?.pdf_file_name) ||
                  t("articlePdfHint")}
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
                  {t("articlePdfRemove")}
                </button>
              </div>
            )}
          </div>

          {previewSrc && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("articlePdfPreview")}
              </span>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                <iframe title={t("articlePdfPreview")} src={previewSrc} className="h-[360px] w-full" />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("articleStatus")}</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="published">{t("articlePublished")}</option>
                <option value="draft">{t("articleDraft")}</option>
              </select>
            </label>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("articleColor")}</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCardColor(color)}
                    className={`h-8 w-8 rounded-full ring-offset-2 dark:ring-offset-gray-900 ${cardColor === color ? "ring-2 ring-brand-500" : ""}`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
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
            {t("saveArticle")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

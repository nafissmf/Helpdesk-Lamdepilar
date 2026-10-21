import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import SearchableSelect from "../form/SearchableSelect";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { ArticleItem, helpdeskAPI } from "../../utils/api";
import { toPlainSnippet } from "./plainText";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewTicketModal({ open, onClose, onCreated }: Props) {
  const { t } = useLanguage();
  const { success, error: toastError } = useToast();
  const [title, setTitle] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [maxChars, setMaxChars] = useState(150);
  const [services, setServices] = useState<{ id: string; label: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    helpdeskAPI.getConfig().then((res) => {
      if (res.success && res.data) setMaxChars(res.data.description_max);
    });
    helpdeskAPI.getServices().then((res) => {
      if (res.success && res.data) {
        setServices(res.data.map((item) => ({ id: String(item.id), label: item.name })));
      }
    });
  }, [open]);

  useEffect(() => {
    if (!serviceId) {
      setCategories([]);
      setCategoryId("");
      return;
    }
    helpdeskAPI.getCategories(Number(serviceId)).then((res) => {
      if (res.success && res.data) {
        setCategories(res.data.map((item) => ({ id: String(item.id), label: item.name })));
      }
    });
  }, [serviceId]);

  useEffect(() => {
    if (!open || title.trim().length < 3) {
      setArticles([]);
      return;
    }
    const timer = window.setTimeout(() => {
      helpdeskAPI.getArticles(title.trim()).then((res) => {
        if (res.success && res.data) {
          setArticles(res.data.items.filter((item) => item.status === "published").slice(0, 3));
        }
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [title, open]);

  const reset = () => {
    setTitle("");
    setStudyProgram("");
    setServiceId("");
    setCategoryId("");
    setDescription("");
    setPriority(false);
    setFile(null);
    setErrors({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = t("fieldRequired");
    if (!studyProgram.trim()) next.studyProgram = t("fieldRequired");
    if (!serviceId) next.service = t("fieldRequired");
    if (!categoryId) next.category = t("fieldRequired");
    if (!description.trim()) next.description = t("fieldRequired");
    if (description.length > maxChars) next.description = `${description.length}/${maxChars}`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("study_program", studyProgram.trim());
    form.set("service_id", serviceId);
    form.set("category_id", categoryId);
    form.set("description", description.trim());
    form.set("staff_priority", priority ? "true" : "false");
    if (file) form.append("files", file);
    const res = await helpdeskAPI.createTicket(form);
    setSaving(false);
    if (!res.success) {
      toastError(res.message || t("loadError"));
      return;
    }
    success(t("ticketCreated"));
    reset();
    onCreated();
  };

  const hints = useMemo(() => articles, [articles]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-gray-900/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("ticketModalTitle")}</h2>
            <p className="text-sm text-gray-500">{t("ticketModalSubtitle")}</p>
          </div>
          <button type="button" onClick={close} className="text-gray-400" aria-label={t("cancel")}>
            ×
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-6 py-4">
          <Field label={t("title")} error={errors.title}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
          </Field>
          <Field label={t("studyProgram")} error={errors.studyProgram}>
            <input
              value={studyProgram}
              onChange={(e) => setStudyProgram(e.target.value)}
              placeholder={t("studyProgramPlaceholder")}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
          </Field>
          <Field label={t("service")} error={errors.service}>
            <SearchableSelect
              options={services}
              value={serviceId}
              onChange={(value) => {
                setServiceId(value);
                setCategoryId("");
              }}
              placeholder={t("servicePlaceholder")}
            />
          </Field>
          <Field label={t("category")} error={errors.category}>
            <SearchableSelect
              options={categories}
              value={categoryId}
              onChange={setCategoryId}
              placeholder={t("categoryPlaceholder")}
              disabled={!serviceId}
            />
          </Field>
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} className="mt-1" />
            <span>{t("priorityLabel")}</span>
          </label>
          <Field label={t("description")} error={errors.description}>
            <textarea
              value={description}
              maxLength={maxChars}
              onChange={(e) => setDescription(e.target.value.slice(0, maxChars))}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <p className="text-right text-xs text-gray-400">{description.length}/{maxChars}</p>
          </Field>
          <Field label={t("attachment")} required={false}>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
              <span>{file ? file.name : t("attachmentHint")}</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </Field>
          {hints.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">{t("relatedArticles")}</p>
              <ul className="space-y-2">
                {hints.map((article) => (
                  <li key={article.id}>
                    <Link to={`/knowledge-base/${article.id}`} onClick={close} className="text-sm text-brand-600">
                      {article.title}
                      <span className="mt-0.5 block text-xs text-gray-500">{toPlainSnippet(article.body, 90)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={close} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {t("createTicket")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  required = true,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}

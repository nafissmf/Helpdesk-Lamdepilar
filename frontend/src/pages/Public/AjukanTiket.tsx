import { FormEvent, lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import PageMeta from "../../components/common/PageMeta";
import SearchableSelect from "../../components/form/SearchableSelect";
import { toPlainSnippet } from "../../components/helpdesk/plainText";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import {
  ArticleItem,
  PublicServiceItem,
  publicHelpdeskAPI,
} from "../../utils/api";

const LazyTurnstile = lazy(() =>
  import("@marsidev/react-turnstile").then((m) => ({ default: m.Turnstile }))
);

export default function PublicAjukanTiket() {
  const { t } = useLanguage();
  const { success, error: toastError } = useToast();
  const [params] = useSearchParams();
  const presetService = params.get("service") || "";
  const presetCategory = params.get("category") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceId, setServiceId] = useState(presetService);
  const [categoryId, setCategoryId] = useState(presetCategory);
  const [file, setFile] = useState<File | null>(null);
  const [maxChars, setMaxChars] = useState(150);
  const [services, setServices] = useState<{ id: string; label: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  useEffect(() => {
    publicHelpdeskAPI.getConfig().then((res) => {
      if (res.success && res.data) setMaxChars(res.data.description_max);
    });
    publicHelpdeskAPI.getServices().then((res) => {
      if (res.success && res.data) {
        setServices(
          (res.data as PublicServiceItem[]).map((item) => ({
            id: String(item.id),
            label: item.name,
          }))
        );
      }
    });
  }, []);

  useEffect(() => {
    if (!serviceId) {
      setCategories([]);
      setCategoryId("");
      return;
    }
    publicHelpdeskAPI.getCategories(Number(serviceId)).then((res) => {
      if (res.success && res.data) {
        setCategories(res.data.map((item) => ({ id: String(item.id), label: item.name })));
      }
    });
  }, [serviceId]);

  useEffect(() => {
    if (title.trim().length < 3) {
      setArticles([]);
      return;
    }
    const timer = window.setTimeout(() => {
      publicHelpdeskAPI.getArticles(title.trim()).then((res) => {
        if (res.success && res.data) {
          setArticles(res.data.items.slice(0, 3));
        }
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [title]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("fieldRequired");
    if (!email.trim()) next.email = t("fieldRequired");
    if (!phone.trim()) next.phone = t("fieldRequired");
    if (!university.trim()) next.university = t("fieldRequired");
    if (!studyProgram.trim()) next.studyProgram = t("fieldRequired");
    if (!title.trim()) next.title = t("fieldRequired");
    if (!serviceId) next.service = t("fieldRequired");
    if (!categoryId) next.category = t("fieldRequired");
    if (!description.trim()) next.description = t("fieldRequired");
    if (description.length > maxChars) next.description = `${description.length}/${maxChars}`;
    if (turnstileSiteKey && !turnstileToken) next.turnstile = t("fieldRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const form = new FormData();
    form.set("name", name.trim());
    form.set("email", email.trim());
    form.set("phone", phone.trim());
    form.set("university", university.trim());
    form.set("study_program", studyProgram.trim());
    form.set("title", title.trim());
    form.set("description", description.trim());
    form.set("service_id", serviceId);
    form.set("category_id", categoryId);
    if (turnstileToken) form.set("turnstile_token", turnstileToken);
    if (file) form.append("files", file);
    const res = await publicHelpdeskAPI.createTicket(form);
    setSaving(false);
    if (!res.success || !res.data) {
      toastError(res.message || t("loadError"));
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      return;
    }
    success(t("publicSubmitSuccess"));
    setTrackingCode(res.data.tracking_code || res.data.id);
  };

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  if (trackingCode) {
    return (
      <>
        <PageMeta title={t("publicSubmitSuccess")} description={t("publicTrackingHint")} />
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            {t("publicSubmitSuccess")}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-brand-700">{t("publicTrackingCode")}</h1>
          <p className="mt-4 break-all rounded-xl bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800">
            {trackingCode}
          </p>
          <p className="mt-3 text-sm text-slate-500">{t("publicTrackingHint")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={`/lacak-tiket?code=${encodeURIComponent(trackingCode)}&email=${encodeURIComponent(email)}`}
              className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("publicGoTrack")}
            </Link>
            <Link
              to="/"
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              {t("publicBackHome")}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={t("publicSubmitTitle")} description={t("publicSubmitSubtitle")} />
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm font-medium text-brand-500 hover:underline">
          ← {t("publicBackHome")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-brand-700 sm:text-3xl">{t("publicSubmitTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("publicSubmitSubtitle")}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Field label={t("publicFullName")} error={errors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("publicEmail")} error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </Field>
            <Field label={t("publicPhone")} error={errors.phone}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("publicUniversity")} error={errors.university}>
              <input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder={t("publicUniversityPlaceholder")}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </Field>
            <Field label={t("publicStudyProgram")} error={errors.studyProgram}>
              <input
                value={studyProgram}
                onChange={(e) => setStudyProgram(e.target.value)}
                placeholder={t("publicStudyProgramPlaceholder")}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </Field>
          </div>
          <Field label={t("publicSubject")} error={errors.title}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </Field>
          <Field label={t("service")} error={errors.service}>
            <SearchableSelect
              options={services}
              value={serviceId}
              onChange={setServiceId}
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
          <Field
            label={`${t("publicMessage")} (${description.length}/${maxChars})`}
            error={errors.description}
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t("attachment")}>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-600"
            />
          </Field>

          {articles.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">{t("relatedArticles")}</p>
              <ul className="mt-2 space-y-2">
                {articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      to={`/pengetahuan/${article.id}`}
                      className="text-sm font-medium text-brand-500 hover:underline"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-slate-500">{toPlainSnippet(article.body, 100)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {turnstileSiteKey ? (
            <div>
              <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-slate-100" />}>
                <LazyTurnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={handleTurnstileSuccess}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </Suspense>
              {errors.turnstile ? <p className="mt-1 text-xs text-red-500">{errors.turnstile}</p> : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="h-11 w-full rounded-xl bg-brand-500 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? t("publicSubmitting") : t("publicSubmitButton")}
          </button>
        </form>
      </div>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

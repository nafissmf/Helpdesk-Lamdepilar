import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { PublicTicketDetail, publicHelpdeskAPI } from "../../utils/api";

function statusLabel(status: string, t: (k: any) => string) {
  if (status === "open") return t("statusOpen");
  if (status === "in_progress") return t("statusProgress");
  if (status === "resolved") return t("statusResolved");
  return status;
}

export default function PublicLacakTiket() {
  const { t, locale } = useLanguage();
  const { success, error: toastError } = useToast();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [email, setEmail] = useState(params.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<PublicTicketDetail | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replying, setReplying] = useState(false);

  const load = async (nextCode = code, nextEmail = email) => {
    if (!nextCode.trim() || !nextEmail.trim()) return;
    setLoading(true);
    const res = await publicHelpdeskAPI.trackTicket(nextCode.trim(), nextEmail.trim());
    setLoading(false);
    if (!res.success || !res.data) {
      setTicket(null);
      toastError(res.message || t("loadError"));
      return;
    }
    setTicket(res.data);
  };

  useEffect(() => {
    if (params.get("code") && params.get("email")) {
      load(params.get("code") || "", params.get("email") || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    load();
  };

  const onReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyBody.trim()) return;
    setReplying(true);
    const form = new FormData();
    form.set("code", (ticket.tracking_code || ticket.id || code).trim());
    form.set("email", email.trim());
    form.set("body", replyBody.trim());
    if (replyFile) form.append("files", replyFile);
    const res = await publicHelpdeskAPI.replyTicket(form);
    setReplying(false);
    if (!res.success || !res.data) {
      toastError(res.message || t("loadError"));
      return;
    }
    success(t("publicReplySuccess"));
    setReplyBody("");
    setReplyFile(null);
    setTicket(res.data);
  };

  const canReply = ticket && ticket.status !== "resolved";

  return (
    <>
      <PageMeta title={t("publicTrackTitle")} description={t("publicTrackSubtitle")} />
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm font-medium text-brand-500 hover:underline">
          ← {t("publicBackHome")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-brand-700 sm:text-3xl">{t("publicTrackTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("publicTrackSubtitle")}</p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">{t("publicTrackCode")}</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">{t("publicEmail")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-brand-500 text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("publicTrackButton")}
          </button>
        </form>

        {!ticket && !loading ? (
          <p className="mt-6 text-center text-sm text-slate-500">{t("publicTrackEmpty")}</p>
        ) : null}

        {ticket ? (
          <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t("publicTrackingCode")}
                </p>
                <p className="mt-1 break-all font-mono text-sm text-slate-700">
                  {ticket.tracking_code || ticket.id}
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {t("publicStatus")}: {statusLabel(ticket.status, t)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{ticket.title}</h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
            <p className="text-xs text-slate-400">
              {ticket.service_name} · {ticket.category_name}
              {ticket.created_at
                ? ` · ${new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(ticket.created_at))}`
                : ""}
            </p>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">{t("publicReplies")}</h3>
              {ticket.replies.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">{t("publicNoReplies")}</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {ticket.replies.map((reply) => (
                    <li key={reply.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">
                        {reply.author_name || "—"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{reply.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canReply ? (
              <form onSubmit={onReply} className="space-y-3 border-t border-slate-100 pt-4">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">{t("publicReplyButton")}</span>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={4}
                    placeholder={t("publicReplyPlaceholder")}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </label>
                <input
                  type="file"
                  onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600"
                />
                <button
                  type="submit"
                  disabled={replying || !replyBody.trim()}
                  className="h-11 w-full rounded-xl bg-brand-500 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {replying ? t("publicReplying") : t("publicReplyButton")}
                </button>
              </form>
            ) : (
              <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
                {t("publicReplyClosed")}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}

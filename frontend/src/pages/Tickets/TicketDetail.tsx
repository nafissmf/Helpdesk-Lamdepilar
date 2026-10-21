import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import StatusBadge from "../../components/helpdesk/StatusBadge";
import { formatWhen } from "../../components/helpdesk/plainText";
import { ConfirmModal } from "../../components/ui/modal/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { TrashBinIcon } from "../../icons";
import { TicketDetail as TicketDetailData, helpdeskAPI } from "../../utils/api";

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { t, locale } = useLanguage();
  const { success, error } = useToast();
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    const res = await helpdeskAPI.getTicket(String(id));
    if (res.success && res.data) setTicket(res.data);
    else error(res.message || t("loadError"));
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!file) {
      setDraftPreviewUrl(null);
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      setDraftPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setDraftPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!ticket) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }
  const closed = ticket.status === "resolved";
  const canReply =
    !closed &&
    (hasPermission("reply_ticket") || (hasPermission("reply_own_ticket") && ticket.requester_id === user?.id));
  const canClose = hasPermission("close_ticket") && !closed;
  const canDelete = hasPermission("delete_ticket");

  const send = async () => {
    if (!body.trim()) return;
    const form = new FormData();
    form.set("body", body.trim());
    if (file) form.append("files", file);
    const res = await helpdeskAPI.replyTicket(ticket.id, form);
    if (!res.success || !res.data) {
      error(res.message || t("loadError"));
      return;
    }
    setTicket(res.data);
    setBody("");
    setFile(null);
    success(t("sendReply"));
  };

  const closeTicket = async () => {
    const res = await helpdeskAPI.closeTicket(ticket.id);
    if (res.success && res.data) {
      setTicket(res.data);
      success(t("closeTicket"));
    } else error(res.message || t("loadError"));
  };

  const deleteTicket = async () => {
    setDeleting(true);
    const res = await helpdeskAPI.deleteTicket(ticket.id);
    setDeleting(false);
    setConfirmDelete(false);
    if (!res.success) {
      error(res.message || t("loadError"));
      return;
    }
    success(t("ticketDeleted"));
    navigate("/tickets");
  };

  return (
    <>
      <PageMeta title={ticket.title} description={t("conversation")} />
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/tickets" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            <span aria-hidden="true">‹</span>
            {hasPermission("view_all_ticket") ? t("allTickets") : t("myTickets")}
          </Link>
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title={t("deleteTicket")}
              aria-label={t("deleteTicket")}
            >
              <TrashBinIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{ticket.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">{ticket.service_name}</span>
                <span>{ticket.category_name}</span>
                <span className="text-gray-300" aria-hidden="true">·</span>
                <span>{formatWhen(ticket.created_at, locale)}</span>
              </div>
              {(() => {
                const univ =
                  (ticket.institution || "").split(/\s*[—–−-]\s*/).map((p) => p.trim()).filter(Boolean)[0] || null;
                const jurusan = ticket.study_program?.trim() || null;
                if (!univ && !jurusan) return null;
                return (
                  <div className="mt-2 flex max-w-full flex-wrap items-center gap-1.5">
                    {univ && (
                      <span className="inline-flex max-w-full items-center gap-1.5 rounded-xl bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0v7m-7-4.5l7 3.5 7-3.5" />
                        </svg>
                        <span className="truncate">{univ}</span>
                      </span>
                    )}
                    {jurusan && (
                      <span className="inline-flex max-w-full items-center rounded-xl bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                        <span className="truncate">{jurusan}</span>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="space-y-3 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t("conversation")}</p>
            <div className="space-y-3">
              <Message
                name={ticket.requester_name || "—"}
                when={formatWhen(ticket.created_at, locale)}
                body={ticket.description}
                tone="requester"
              >
                <AttachmentLinks ticketId={ticket.id} items={ticket.attachments} />
              </Message>
              {ticket.replies.map((reply) => {
                const mine = reply.author_id === user?.id;
                const fromRequester = reply.author_id === ticket.requester_id;
                return (
                  <Message
                    key={reply.id}
                    name={mine ? t("you") : reply.author_name}
                    when={formatWhen(reply.created_at, locale)}
                    body={reply.body}
                    tone={fromRequester ? "requester" : "staff"}
                  >
                    <AttachmentLinks ticketId={ticket.id} items={reply.attachments} />
                  </Message>
                );
              })}
            </div>
          </div>

          {closed && (
            <div className="mx-6 mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("closedNotice")}
            </div>
          )}

          {(canReply || canClose) && (
            <div className="space-y-3 border-t border-gray-100 px-6 py-5 dark:border-gray-800">
              {canReply && (
                <>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t("replyPlaceholder")}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-500">
                      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                      <span className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-700">{t("attachment")}</span>
                      {file && <span className="max-w-[16rem] truncate">{file.name}</span>}
                    </label>
                    <button type="button" onClick={send} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                      {t("sendReply")}
                    </button>
                  </div>
                  {draftPreviewUrl && file && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                      {file.type.startsWith("image/") ? (
                        <img src={draftPreviewUrl} alt={file.name} className="max-h-[360px] w-full object-contain" />
                      ) : (
                        <iframe title={file.name || t("articlePdfPreview")} src={draftPreviewUrl} className="h-[360px] w-full" />
                      )}
                    </div>
                  )}
                </>
              )}
              {canClose && (
                <button type="button" onClick={closeTicket} className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                  {t("closeTicket")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteTicket}
        title={t("deleteTicketTitle")}
        message={t("deleteTicketBody")}
        confirmText={t("deleteTicketConfirm")}
        cancelText={t("cancel")}
        confirmButtonColor="danger"
        isLoading={deleting}
      />
    </>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function Message({
  name,
  when,
  body,
  tone,
  children,
}: {
  name: string;
  when: string;
  body: string;
  tone: "requester" | "staff";
  children?: ReactNode;
}) {
  const staff = tone === "staff";
  return (
    <article className="flex gap-3">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          staff ? "bg-brand-50 text-brand-700" : "bg-sky-100 text-sky-700"
        }`}
      >
        {initials(name)}
      </span>
      <div
        className={`min-w-0 flex-1 rounded-2xl px-3.5 py-2.5 ${
          staff ? "bg-brand-25 dark:bg-brand-500/10" : "bg-gray-50 dark:bg-white/5"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{name}</p>
          <p className="shrink-0 text-[11px] text-gray-400">{when}</p>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">{body}</p>
        {children}
      </div>
    </article>
  );
}

function isPdfAttachment(item: { file_name: string; mime_type?: string }) {
  const mime = (item.mime_type || "").toLowerCase();
  return mime === "application/pdf" || item.file_name.toLowerCase().endsWith(".pdf");
}

function isImageAttachment(item: { file_name: string; mime_type?: string }) {
  const mime = (item.mime_type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(item.file_name);
}

function AttachmentLinks({
  ticketId,
  items,
}: {
  ticketId: string;
  items: { id: number; file_name: string; mime_type?: string }[];
}) {
  if (!items.length) return null;
  return (
    <ul className="mt-2.5 space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <AttachmentPreview ticketId={ticketId} item={item} />
        </li>
      ))}
    </ul>
  );
}

function AttachmentPreview({
  ticketId,
  item,
}: {
  ticketId: string;
  item: { id: number; file_name: string; mime_type?: string };
}) {
  const { t } = useLanguage();
  const href = `/api/v1/tickets/${ticketId}/attachments/${item.id}`;
  const pdf = isPdfAttachment(item);
  const image = isImageAttachment(item);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!pdf && !image) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const res = await fetch(href, { credentials: "include" });
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setBlobUrl(url);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [href, pdf, image]);

  return (
    <div className="space-y-2">
      <a
        className="inline-flex max-w-full items-center truncate rounded-lg bg-white px-2.5 py-1 text-sm text-brand-600 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:ring-gray-700"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {item.file_name}
      </a>
      {(pdf || image) && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950">
          {failed && (
            <p className="px-3 py-2 text-xs text-gray-500">
              {t("attachmentPreviewFail")}{" "}
              <a href={href} target="_blank" rel="noreferrer" className="font-medium text-brand-600">
                {t("openPdf")}
              </a>
            </p>
          )}
          {!failed && !blobUrl && (
            <div className="flex h-24 items-center justify-center text-xs text-gray-400">{t("attachmentPreview")}…</div>
          )}
          {!failed && blobUrl && pdf && (
            <iframe title={item.file_name || t("attachmentPreview")} src={blobUrl} className="h-[320px] w-full border-0" />
          )}
          {!failed && blobUrl && image && !pdf && (
            <img src={blobUrl} alt={item.file_name} className="max-h-[280px] w-full object-contain bg-gray-50 dark:bg-gray-950" />
          )}
        </div>
      )}
    </div>
  );
}

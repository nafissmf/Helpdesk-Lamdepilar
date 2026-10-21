import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { AppNotification, helpdeskAPI } from "../../utils/api";
import { formatWhen } from "../helpdesk/plainText";

export default function NotificationDropdown() {
  const { t, locale } = useLanguage();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = async () => {
    if (!hasPermission("view_notification")) return;
    const res = await helpdeskAPI.getNotifications();
    if (res.success && res.data) setItems(res.data.items);
  };

  useEffect(() => {
    load();
  }, []);

  if (!hasPermission("view_notification")) return null;
  const unread = items.some((item) => !item.is_read);

  const label = (item: AppNotification) => {
    const title = item.payload.title || "";
    if (item.message_key === "ticket.replied") return t("notifReplied", { title });
    if (item.message_key === "ticket.requester_replied") return t("notifRequester", { title });
    return t("notifStatus", { title });
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-600 transition-colors hover:bg-brand-50 dark:border-brand-900/50 dark:bg-gray-900 dark:text-brand-300 dark:hover:bg-brand-500/10"
        onClick={() => {
          setIsOpen((open) => !open);
          load();
        }}
        aria-label={t("notifications")}
      >
        {unread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-400" />}
        <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.2L2.7 13.4A1 1 0 003.6 15h12.8a1 1 0 00.9-1.6L16 11.2V8a6 6 0 00-6-6zm0 16a2.5 2.5 0 01-2.45-2h4.9A2.5 2.5 0 0110 18z" />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute right-0 mt-3 flex max-h-96 w-80 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-lg"
      >
        <h5 className="mb-2 text-sm font-semibold text-gray-800">{t("notifications")}</h5>
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-gray-500">{t("noNotifications")}</p>
        ) : (
          <ul className="overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`w-full rounded-lg px-2 py-2 text-left text-sm ${item.is_read ? "text-gray-500" : "text-gray-800"}`}
                  onClick={async () => {
                    await helpdeskAPI.markNotificationRead(item.id);
                    setIsOpen(false);
                    if (item.payload.ticket_id) navigate(`/tickets/${item.payload.ticket_id}`);
                    load();
                  }}
                >
                  <span className="block">{label(item)}</span>
                  <span className="text-xs text-gray-400">{formatWhen(item.created_at, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dropdown>
    </div>
  );
}

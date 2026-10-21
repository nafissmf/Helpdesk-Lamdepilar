import { useLanguage } from "../../context/LanguageContext";

const style: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-green-50 text-green-700",
};

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const label =
    status === "resolved" ? t("statusResolved") : status === "in_progress" ? t("statusProgress") : t("statusOpen");
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style[status] || style.open}`}>
      {status === "resolved" && (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label}
    </span>
  );
}

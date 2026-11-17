import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { useLanguage } from "../../context/LanguageContext";
import { PublicStats, publicHelpdeskAPI } from "../../utils/api";

export default function PublicMonitoring() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    publicHelpdeskAPI.getStats().then((res) => {
      if (res.success && res.data) setStats(res.data);
    });
  }, []);

  const cards = [
    { label: t("totalRequests"), value: stats?.total ?? 0, color: "bg-brand-50 text-brand-700" },
    { label: t("statusOpen"), value: stats?.open ?? 0, color: "bg-amber-50 text-amber-700" },
    { label: t("statusProgress"), value: stats?.in_progress ?? 0, color: "bg-brand-100 text-brand-700" },
    { label: t("statusResolved"), value: stats?.resolved ?? 0, color: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <>
      <PageMeta title={t("publicMonitoringTitle")} description={t("publicMonitoringSubtitle")} />
      <div>
        <Link to="/" className="text-sm font-medium text-brand-500 hover:underline">
          ← {t("publicBackHome")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-brand-700 sm:text-3xl">
          {t("publicMonitoringTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{t("publicMonitoringSubtitle")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className={`rounded-2xl px-5 py-6 ${card.color}`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

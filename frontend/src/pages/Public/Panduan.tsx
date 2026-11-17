import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { useLanguage } from "../../context/LanguageContext";
import { ManualItem, publicHelpdeskAPI } from "../../utils/api";

export default function PublicPanduan() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ManualItem[]>([]);

  useEffect(() => {
    publicHelpdeskAPI.getManualIndex().then((res) => {
      if (res.success && res.data) setItems(res.data.items);
    });
  }, []);

  return (
    <>
      <PageMeta title={t("publicGuideTitle")} description={t("publicGuideSubtitle")} />
      <div>
        <Link to="/" className="text-sm font-medium text-brand-500 hover:underline">
          ← {t("publicBackHome")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-brand-700 sm:text-3xl">{t("publicGuideTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("publicGuideSubtitle")}</p>

        <div className="mt-8 space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/panduan/${item.slug}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-brand-300"
            >
              <span className="font-medium text-slate-900">{item.title}</span>
              <span className="text-brand-500">→</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

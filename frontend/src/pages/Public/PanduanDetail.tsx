import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import MarkdownView from "../../components/helpdesk/MarkdownView";
import { useLanguage } from "../../context/LanguageContext";
import { ManualItem, publicHelpdeskAPI } from "../../utils/api";

export default function PublicPanduanDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const [page, setPage] = useState<ManualItem | null>(null);

  useEffect(() => {
    if (!slug) return;
    publicHelpdeskAPI.getManual(slug).then((res) => {
      if (res.success && res.data) setPage(res.data);
    });
  }, [slug]);

  if (!page) {
    return <p className="text-sm text-slate-500">...</p>;
  }

  return (
    <>
      <PageMeta title={page.title} description={t("publicGuideTitle")} />
      <div className="mx-auto max-w-3xl">
        <Link to="/panduan" className="text-sm font-medium text-brand-500 hover:underline">
          ← {t("publicNavGuide")}
        </Link>
        <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-brand-700 sm:text-3xl">{page.title}</h1>
          <div className="mt-6 text-slate-700">
            <MarkdownView source={page.body || ""} />
          </div>
        </article>
      </div>
    </>
  );
}

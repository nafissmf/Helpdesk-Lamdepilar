import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { toPlainSnippet } from "../../components/helpdesk/plainText";
import { useLanguage } from "../../context/LanguageContext";
import { ArticleItem, publicHelpdeskAPI } from "../../utils/api";

export default function PublicPengetahuan() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ArticleItem[]>([]);

  const load = async (q = query) => {
    const res = await publicHelpdeskAPI.getArticles(q);
    if (res.success && res.data) setItems(res.data.items);
  };

  useEffect(() => {
    load("");
  }, []);

  return (
    <>
      <PageMeta title={t("publicKnowledgeTitle")} description={t("publicKnowledgeSubtitle", { n: items.length })} />
      <div>
        <Link to="/" className="text-sm font-medium text-brand-500 hover:underline">
          ← {t("publicBackHome")}
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-700 sm:text-3xl">{t("publicKnowledgeTitle")}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {t("publicKnowledgeSubtitle", { n: items.length })}
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              load(e.target.value);
            }}
            placeholder={t("publicKnowledgeSearch")}
            className="h-11 w-full max-w-xs rounded-full border border-slate-200 bg-white px-4 text-sm"
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/pengetahuan/${item.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="mb-3 h-1.5 w-12 rounded-full"
                style={{ backgroundColor: item.card_color || "#2B7DE0" }}
              />
              <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{toPlainSnippet(item.body, 120)}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

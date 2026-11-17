import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import MarkdownView from "../../components/helpdesk/MarkdownView";
import { useLanguage } from "../../context/LanguageContext";
import { ArticleItem, publicHelpdeskAPI } from "../../utils/api";

export default function PublicPengetahuanDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [article, setArticle] = useState<ArticleItem | null>(null);

  useEffect(() => {
    if (!id) return;
    publicHelpdeskAPI.getArticle(Number(id)).then((res) => {
      if (res.success && res.data) setArticle(res.data);
    });
  }, [id]);

  if (!article) {
    return <p className="text-sm text-slate-500">...</p>;
  }

  return (
    <>
      <PageMeta title={article.title} description={t("publicKnowledgeTitle")} />
      <div className="mx-auto max-w-3xl">
        <Link to="/pengetahuan" className="text-sm font-medium text-brand-500 hover:underline">
          ← {t("publicNavKnowledge")}
        </Link>
        <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            className="mb-4 h-1.5 w-16 rounded-full"
            style={{ backgroundColor: article.card_color || "#2B7DE0" }}
          />
          <h1 className="text-2xl font-bold text-brand-700 sm:text-3xl">{article.title}</h1>
          <div className="prose-helpdesk mt-6 text-slate-700">
            <MarkdownView source={article.body} />
          </div>
        </article>
      </div>
    </>
  );
}

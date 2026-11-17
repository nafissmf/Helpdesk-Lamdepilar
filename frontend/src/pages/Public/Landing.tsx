import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { toPlainSnippet } from "../../components/helpdesk/plainText";
import { useLanguage } from "../../context/LanguageContext";
import { publicHelpdeskAPI, type PublicServiceItem } from "../../utils/api";

function ServiceCard({ item }: { item: PublicServiceItem }) {
  return (
    <Link
      to={`/ajukan?service=${item.id}`}
      className="group flex h-full flex-col rounded-2xl border border-brand-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <div
        className="mb-3 h-1.5 w-12 rounded-full"
        style={{ backgroundColor: item.card_color || "#8b1538" }}
      />
      <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600">
        {item.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
        {toPlainSnippet(item.description || "", 140) || "—"}
      </p>
    </Link>
  );
}

function Section({
  title,
  body,
  items,
  empty,
}: {
  title: string;
  body: string;
  items: PublicServiceItem[];
  empty: string;
}) {
  return (
    <section className="mt-10">
      <div className="mb-5 max-w-3xl">
        <h2 className="text-xl font-bold text-brand-700 sm:text-2xl">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{body}</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          {empty}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ServiceCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function PublicLanding() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<PublicServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    publicHelpdeskAPI.getServices(query.trim()).then((res) => {
      if (!alive) return;
      if (res.success && res.data) setServices(res.data);
      else setServices([]);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [query]);

  const infoServices = useMemo(
    () => services.filter((item) => item.group !== "complaint"),
    [services]
  );
  const complaintServices = useMemo(
    () => services.filter((item) => item.group === "complaint"),
    [services]
  );

  return (
    <>
      <PageMeta title={`${t("publicHeroTitle")} ${t("publicHeroOrg")}`} description={t("publicHeroSubtitle")} />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-800 px-6 py-12 text-white shadow-lg sm:px-10 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2), transparent 35%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-white/75">{t("publicHeroOrg")}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            {t("publicHeroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            {t("publicHeroSubtitle")}
          </p>
          <label className="relative mx-auto mt-8 block max-w-xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("publicSearchPlaceholder")}
              className="h-12 w-full rounded-full border-0 bg-white pl-12 pr-4 text-sm text-slate-800 shadow outline-none ring-0 placeholder:text-slate-400"
            />
          </label>
        </div>
      </section>

      {loading ? (
        <p className="mt-10 text-center text-sm text-slate-500">...</p>
      ) : (
        <>
          <Section
            title={t("publicInfoSection")}
            body={t("publicInfoSectionBody")}
            items={infoServices}
            empty={t("publicNoServices")}
          />
          <div className="mt-6">
            <Link
              to="/ajukan"
              className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-brand-300/60 bg-brand-50 px-5 py-4 text-brand-700 transition hover:bg-brand-100"
            >
              <div>
                <p className="font-semibold">+ {t("publicSeeAllServices")}</p>
                <p className="mt-1 text-sm text-slate-600">{t("publicSeeAllServicesBody")}</p>
              </div>
              <span className="text-2xl">→</span>
            </Link>
          </div>
          <Section
            title={t("publicComplaintSection")}
            body={t("publicComplaintSectionBody")}
            items={complaintServices}
            empty={t("publicNoServices")}
          />
        </>
      )}
    </>
  );
}

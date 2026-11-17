import { Link, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { getDefaultHomePath, userHasPermission } from "../utils/homePath";

function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();
  return (
    <div className="flex overflow-hidden rounded-full border border-white/25 bg-white/10 text-xs">
      <button
        type="button"
        onClick={() => setLocale("id")}
        className={`px-2.5 py-1 font-semibold ${locale === "id" ? "bg-white text-brand-500" : "text-white/90"}`}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 font-semibold ${locale === "en" ? "bg-white text-brand-500" : "text-white/90"}`}
      >
        EN
      </button>
    </div>
  );
}

export default function PublicLayout() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { getLogoUrl, settings } = useSettings();
  const location = useLocation();
  const siteName = settings?.general?.site_name || t("brand");
  const dashboardPath = getDefaultHomePath((perm) => userHasPermission(user, perm));

  const nav = [
    { to: "/lacak-tiket", label: t("publicNavTrack") },
    { to: "/panduan", label: t("publicNavGuide") },
    { to: "/monitoring", label: t("publicNavMonitoring") },
    { to: "/pengetahuan", label: t("publicNavKnowledge") },
  ];

  return (
    <div className="min-h-screen bg-brand-25 text-slate-800">
      <header className="border-b border-white/10 bg-brand-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={getLogoUrl(false)} alt={siteName} className="h-9 w-auto brightness-0 invert" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide">{siteName}</p>
              <p className="truncate text-[11px] text-white/70">{t("product")}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitch />
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 sm:text-sm"
              >
                {t("publicGoDashboard")}
              </Link>
            ) : (
              <Link
                to="/signin"
                state={{ from: location.pathname }}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 sm:text-sm"
              >
                {t("publicSignIn")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-4 sm:gap-3 sm:px-6 sm:py-5">
          {nav.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition sm:text-base ${
                  active
                    ? "bg-white text-brand-700 shadow-sm"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useSettings } from "../../context/SettingsContext";
import FaviconUpdater from "../../components/common/FaviconUpdater";
import SignInForm from "../../components/auth/SignInForm";
import PageMeta from "../../components/common/PageMeta";
import SignUpContactAdmin from "../../components/auth/SignUpContactAdmin";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();
  return (
    <div className="flex overflow-hidden rounded-full border border-white/20 bg-white/15 text-xs shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setLocale("id")}
        className={`px-3 py-1.5 font-semibold ${locale === "id" ? "bg-white text-brand-500" : "text-white/85"}`}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-3 py-1.5 font-semibold ${locale === "en" ? "bg-white text-brand-500" : "text-white/85"}`}
      >
        EN
      </button>
    </div>
  );
}

function AuthThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25"
    >
      {theme === "dark" ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}
    </button>
  );
}

function HelpdeskIllustration() {
  return (
    <div className="relative mx-auto mb-5 h-36 w-full max-w-[250px]" aria-hidden="true">
      <div className="absolute left-1/2 top-1 h-28 w-40 -translate-x-1/2 rounded-2xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-1.5 border-b border-white/15 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        </div>
        <div className="space-y-1.5 p-2.5">
          <div className="h-2 w-3/4 rounded bg-white/35" />
          <div className="h-2 w-1/2 rounded bg-white/25" />
          <div className="mt-2 h-12 rounded-xl bg-gradient-to-br from-white/25 to-white/10" />
        </div>
      </div>

      <div className="absolute -left-1 top-8 w-24 rounded-xl border border-white/25 bg-white p-2 shadow-lg">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-600">
            U
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-1.5 w-12 rounded bg-gray-200" />
            <div className="mt-1 h-1 w-8 rounded bg-gray-100" />
          </div>
        </div>
        <div className="h-6 rounded-md bg-brand-50" />
      </div>

      <div className="absolute -right-1 top-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
        <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
          />
        </svg>
      </div>

      <div className="absolute bottom-0 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-white shadow-lg ring-4 ring-white/25">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}

function AuthBrandPanel() {
  const { t } = useLanguage();
  const features = [
    {
      label: t("authFeatureAsk"),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
        />
      ),
    },
    {
      label: t("authFeatureTrack"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19V5m4 14V9m4 10v-6m4 6V7m4 12V11" />
      ),
    },
    {
      label: t("authFeatureGuide"),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 6.5c-1.8-1.2-4.2-1.5-7-.8v12.2c2.8-.7 5.2-.4 7 .8 1.8-1.2 4.2-1.5 7-.8V5.7c-2.8-.7-5.2-.4-7 .8z"
        />
      ),
    },
  ];

  return (
    <div className="relative z-10 flex h-full w-full max-w-md flex-col justify-center px-1 text-left">
      <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        {t("authBadgeHelpdesk")}
      </span>

      <h2 className="mb-2 text-2xl font-extrabold leading-tight tracking-tight text-white xl:text-[2rem]">
        {t("authPanelHeadline")}
      </h2>
      <p className="mb-4 max-w-sm text-sm leading-relaxed text-rose-100/95">{t("authPanelBody")}</p>

      <HelpdeskIllustration />

      <ul className="space-y-2.5">
        {features.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-sm text-white/95">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.icon}
              </svg>
            </span>
            <span className="font-medium leading-snug">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base gradient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,#b91c4a_0%,transparent_45%),radial-gradient(ellipse_at_80%_10%,#7f1d1d_0%,transparent_40%),radial-gradient(ellipse_at_70%_85%,#4c0519_0%,transparent_50%),linear-gradient(160deg,#8b1538_0%,#6b102c_40%,#3f0a1a_100%)]" />

      {/* Soft animated orbs */}
      <div className="auth-orb-a absolute -left-24 -top-20 h-[26rem] w-[26rem] rounded-full bg-[#e11d48]/25 blur-3xl" />
      <div className="auth-orb-b absolute -right-28 top-1/4 h-[30rem] w-[30rem] rounded-full bg-[#9f1239]/45 blur-3xl" />
      <div className="auth-orb-c absolute bottom-[-8rem] left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#450a0a]/70 blur-3xl" />
      <div className="auth-shimmer absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

      {/* Flowing wave shapes */}
      <svg
        className="auth-wave-a absolute -bottom-16 left-[-10%] h-[55%] w-[140%] text-[#4c0519]/55"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,229.3C672,245,768,235,864,208C960,181,1056,139,1152,138.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      <svg
        className="auth-wave-b absolute -bottom-8 left-[-5%] h-[42%] w-[130%] text-[#9f1239]/35"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,288L60,272C120,256,240,224,360,213.3C480,203,600,213,720,229.3C840,245,960,267,1080,250.7C1200,235,1320,181,1380,154.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>

      {/* Geometric rings */}
      <div className="absolute -left-20 top-16 h-80 w-80 rounded-full border border-white/[0.07]" />
      <div className="absolute -left-8 top-28 h-56 w-56 rounded-full border border-white/[0.05]" />
      <div className="absolute -right-24 bottom-24 h-[28rem] w-[28rem] rounded-full border border-white/[0.06]" />
      <div className="absolute -right-10 bottom-40 h-72 w-72 rounded-full border border-white/[0.04]" />
      <div className="absolute left-[42%] top-[18%] h-40 w-40 rounded-full border border-white/[0.05]" />

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 85%)",
        }}
      />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(30,5,12,0.55)_100%)]" />
    </div>
  );
}

export default function ModernAuth() {
  const location = useLocation();
  const { t } = useLanguage();
  const { settings } = useSettings();

  const [isSignUp, setIsSignUp] = useState(location.pathname === "/signup");

  useEffect(() => {
    setIsSignUp(location.pathname === "/signup");
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-[#6b102c] p-4 transition-colors duration-500 sm:p-6 lg:p-8 dark:bg-[#3f0a1a]">
      <FaviconUpdater />
      <PageMeta
        title={isSignUp ? t("authSignUpLink") : t("authSignInTitle")}
        description={t("authPanelBody")}
      />

      <div className="fixed right-5 top-5 z-50 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitch />
        <AuthThemeToggle />
      </div>

      <AuthBackdrop />

      <div className="relative flex w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-[0_25px_80px_-20px_rgba(40,5,18,0.55)] ring-1 ring-black/10 dark:bg-slate-900 dark:ring-white/10 md:min-h-[560px] xl:min-h-[620px]">
        {/* Desktop brand pane (left, like DAISY) */}
        <div className="relative hidden w-[46%] overflow-hidden bg-gradient-to-br from-[#9f1239] via-[#8b1538] to-[#4c0519] md:flex">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -left-8 -top-8 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full border border-white/10" />
            <div className="absolute bottom-8 left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          </div>
          <div className="relative flex w-full items-center justify-center p-8 xl:p-12">
            <AuthBrandPanel />
          </div>
        </div>

        {/* Mobile forms */}
        <div className="relative w-full md:hidden">
          <div className={`p-6 sm:p-8 ${isSignUp ? "hidden" : "block"}`}>
            <SignInForm />
          </div>
          <div className={`p-6 sm:p-8 ${isSignUp ? "block" : "hidden"}`}>
            <SignUpContactAdmin />
          </div>
        </div>

        {/* Desktop form pane */}
        <div className="relative hidden w-[54%] md:block">
          <div
            className={`absolute inset-0 flex items-start justify-center overflow-y-auto p-6 transition-all duration-500 xl:items-center xl:p-10 ${
              isSignUp ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div className="w-full max-w-[340px] py-2">
              <SignInForm />
            </div>
          </div>
          <div
            className={`absolute inset-0 flex items-start justify-center overflow-y-auto p-6 transition-all duration-500 xl:items-center xl:p-10 ${
              !isSignUp ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div className="w-full max-w-[340px] py-2">
              <SignUpContactAdmin />
            </div>
          </div>
        </div>
      </div>

      <p className="relative mt-5 text-center text-xs text-white/55">
        {settings?.general?.site_name || t("brand")} · {t("authProductLabel")}
      </p>
    </div>
  );
}

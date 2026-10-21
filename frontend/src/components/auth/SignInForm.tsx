import {
  useState,
  FormEvent,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { Link, useLocation } from "react-router";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { authAPI } from "../../utils/api";
import { setAccessTokenExpiryFromNow } from "../../utils/sessionManager";
import { resolvePostLoginPathForUser } from "../../utils/homePath";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import AppLogo from "../common/AppLogo";

const LazyTurnstile = lazy(() =>
  import("@marsidev/react-turnstile").then((m) => ({ default: m.Turnstile }))
);
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function toTrustedScriptUrl(url: string): string {
  const tt = (window as Window & {
    trustedTypes?: {
      createPolicy: (
        name: string,
        rules: { createScriptURL: (input: string) => string }
      ) => { createScriptURL: (input: string) => string };
    };
  }).trustedTypes;
  if (!tt) return url;
  try {
    const policy = tt.createPolicy("turnstile-policy", {
      createScriptURL: (input: string) => input,
    });
    return String(policy.createScriptURL(url));
  } catch {
    return url;
  }
}

function TurnstilePlaceholder() {
  return (
    <div
      className="flex h-[65px] w-[300px] max-w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/60 text-xs text-gray-500 dark:border-slate-600 dark:bg-slate-800/40 dark:text-gray-400"
      aria-hidden
    >
      Memuat verifikasi…
    </div>
  );
}

export default function SignInForm() {
  const location = useLocation();
  const { fetchUser } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const siteName = settings?.general?.site_name;
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const [turnstileScriptReady, setTurnstileScriptReady] = useState(false);

  useEffect(() => {
    if (!turnstileSiteKey) {
      setTurnstileScriptReady(false);
      return;
    }
    if (window.turnstile) {
      setTurnstileScriptReady(true);
      return;
    }

    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const onLoadExisting = () => setTurnstileScriptReady(true);
      const onErrorExisting = () => setTurnstileScriptReady(false);
      existing.addEventListener("load", onLoadExisting);
      existing.addEventListener("error", onErrorExisting);
      return () => {
        existing.removeEventListener("load", onLoadExisting);
        existing.removeEventListener("error", onErrorExisting);
      };
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    // Satisfy CSP with Trusted Types in hardened production policies.
    script.src = toTrustedScriptUrl(TURNSTILE_SCRIPT_URL) as unknown as string;

    const onLoad = () => setTurnstileScriptReady(true);
    const onError = () => setTurnstileScriptReady(false);
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, [turnstileSiteKey]);

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  // Auto-fill credentials in development mode
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const [formData, setFormData] = useState({
    email: isDevelopment ? (import.meta.env.VITE_DEV_ADMIN_EMAIL || "superadmin@local.com") : "",
    password: isDevelopment ? (import.meta.env.VITE_DEV_ADMIN_PASSWORD || "12341234") : "",
  });

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear state after showing message
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validasi form
    if (!formData.email.trim()) {
      setError("Email harus diisi");
      setIsLoading(false);
      return;
    }

    if (!formData.password) {
      setError("Password harus diisi");
      setIsLoading(false);
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Format email tidak valid");
      setIsLoading(false);
      return;
    }

    if (turnstileSiteKey) {
      if (!turnstileScriptReady) {
        setError("Verifikasi keamanan masih dimuat. Tunggu sebentar lalu coba lagi.");
        setIsLoading(false);
        return;
      }
      if (!turnstileToken?.trim()) {
        setError("Selesaikan verifikasi keamanan di bawah ini terlebih dahulu.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await authAPI.login({
        email: formData.email.trim(),
        password: formData.password,
        remember_me: isChecked,
        ...(turnstileSiteKey && turnstileToken
          ? { turnstile_token: turnstileToken }
          : {}),
      });


      // Backend mengembalikan { status: "success", message: "...", data: {...} }
      // apiRequest mengembalikan data langsung dari backend (tidak wrap lagi)
      const responseStatus = (response as any).status;
      const isSuccess = responseStatus === "success" || response.success === true;
      const hasData = response.data !== null && response.data !== undefined;

      console.log('isSuccess:', isSuccess, 'hasData:', hasData);

      if (isSuccess && hasData) {

        const loginData = response.data as { expires_in?: number };
        if (typeof loginData?.expires_in === 'number' && loginData.expires_in > 0) {
          setAccessTokenExpiryFromNow(loginData.expires_in);
        }

        // Token sudah di-set di HttpOnly cookie oleh backend.
        // Ambil user dulu agar redirect hanya ke halaman yang boleh diakses.
        const requested = location.state?.from?.pathname as string | undefined;
        const me = await fetchUser(true);
        const target = resolvePostLoginPathForUser(requested, me);
        window.location.href = target;
      } else {
        const errorMsg = response.message || (response as any).message || response.error || "Login gagal. Silakan coba lagi.";
        console.error('Login failed:', errorMsg);
        setError(errorMsg);
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || err.error || "Terjadi kesalahan. Silakan coba lagi.");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setIsLoading(false);
    }
  };

  const brandName = siteName || t("brand");

  return (
    <div className="flex w-full flex-col justify-center">
      <div className="mb-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-3">
          <AppLogo isSquare className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-left">
            <span className="block text-[15px] font-extrabold tracking-tight text-gray-900 dark:text-white">
              {isSettingsLoading ? t("brand") : brandName}
            </span>
            <span className="block text-xs font-medium text-gray-400">{t("authProductLabel")}</span>
          </span>
        </Link>

        <h1 className="mb-1.5 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white xl:text-3xl">
          {t("authSignInTitle")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("authSignInSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <Label>{t("authEmailLabel")}</Label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500/70">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </span>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t("authEmailPlaceholder")}
              disabled={isLoading}
              className="pl-10 !border-gray-300 hover:!border-brand-300 focus:!border-brand-500 focus:!ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <Label>{t("authPasswordLabel")}</Label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-brand-500/70">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </span>
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t("authPasswordPlaceholder")}
              disabled={isLoading}
              className="pl-10 pr-11 !border-gray-300 hover:!border-brand-300 focus:!border-brand-500 focus:!ring-brand-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 z-30 -translate-y-1/2 text-brand-500/60 hover:text-brand-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeIcon className="size-5 fill-current" />
              ) : (
                <EyeCloseIcon className="size-5 fill-current" />
              )}
            </button>
          </div>
        </div>

        <div className="pt-0.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={isChecked}
              onChange={setIsChecked}
              className="checked:border-brand-500 checked:bg-brand-500 dark:checked:bg-brand-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t("authKeepLoggedIn")}</span>
          </label>
        </div>

        {turnstileSiteKey ? (
          <div className="flex justify-center py-1">
            {!turnstileScriptReady ? (
              <TurnstilePlaceholder />
            ) : (
              <Suspense fallback={<TurnstilePlaceholder />}>
                <LazyTurnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  injectScript={false}
                  onSuccess={handleTurnstileSuccess}
                  onExpire={handleTurnstileExpire}
                  onError={handleTurnstileError}
                  options={{
                    theme: theme,
                    size: "normal",
                    action: "login",
                    language: "id",
                  }}
                />
              </Suspense>
            )}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={
            isLoading ||
            (Boolean(turnstileSiteKey) && (!turnstileScriptReady || !turnstileToken?.trim()))
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 hover:shadow-brand-500/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? t("authSigningIn") : t("authSignInButton")}
          {!isLoading && (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
      </form>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
        <svg className="h-3.5 w-3.5 text-brand-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          {t("authNeedHelp")}{" "}
          <Link to="/signup" className="font-medium text-brand-500 hover:text-brand-600">
            {t("authOpenGuide")}
          </Link>
        </span>
      </p>
    </div>
  );
}

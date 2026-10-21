import React from "react";
import { Link, useLocation } from "react-router";
import { DocsIcon, GridIcon, ListIcon, PieChartIcon } from "../icons";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { t } = useLanguage();

  const canGuides =
    hasPermission(["view_article", "manage_article"]) ||
    hasPermission(["view_manual", "manage_manual"]);
  const guidesPath = hasPermission(["view_article", "manage_article"])
    ? "/knowledge-base"
    : "/manual";

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname.startsWith("/dashboard");
    }
    if (path === guidesPath) {
      return (
        location.pathname.startsWith("/knowledge-base") ||
        location.pathname.startsWith("/manual")
      );
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const items = [
    { path: "/dashboard", label: t("dashboard"), icon: <GridIcon />, show: hasPermission("view_dashboard") },
    { path: "/tickets", label: hasPermission("view_all_ticket") ? t("allTickets") : t("myTickets"), icon: <ListIcon />, show: hasPermission(["view_own_ticket", "view_all_ticket"]) },
    { path: guidesPath, label: t("guides"), icon: <DocsIcon />, show: canGuides },
    { path: "/reports", label: t("reports"), icon: <PieChartIcon />, show: hasPermission(["view_own_report", "view_all_report"]) },
  ].filter((item) => item.show);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-gray-200 bg-white px-2 py-2 lg:hidden dark:border-white/8 dark:bg-[#161922]">
      {items.map((item) => (
        <Link key={item.path} to={item.path} className="flex w-full flex-col items-center justify-center">
          <div className={`mb-1 h-6 w-6 ${isActive(item.path) ? "text-brand-500" : "text-gray-500"}`}>{item.icon}</div>
          <span className={`text-[10px] font-medium ${isActive(item.path) ? "text-brand-500" : "text-gray-500"}`}>{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default MobileBottomNav;

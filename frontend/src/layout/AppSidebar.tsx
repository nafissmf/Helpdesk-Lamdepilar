import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import {
  ChevronDownIcon,
  DocsIcon,
  FolderIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  LockIcon,
  PieChartIcon,
  SettingsIcon,
  UserIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import AppLogo from "../components/common/AppLogo";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    requiredPermission?: string | string[];
  }[];
  requiredPermission?: string | string[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { hasPermission, user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const siteName = settings?.general?.site_name?.trim() || t("product");

  const sidebarGroups = useMemo<NavGroup[]>(() => [
    {
      title: t("mainMenu"),
      items: [
        { icon: <GridIcon />, name: t("dashboard"), path: "/dashboard", requiredPermission: "view_dashboard" },
        { icon: <ListIcon />, name: hasPermission("view_all_ticket") ? t("allTickets") : t("myTickets"), path: "/tickets", requiredPermission: ["view_own_ticket", "view_all_ticket"] },
        {
          icon: <DocsIcon />,
          name: t("guides"),
          subItems: [
            { name: t("knowledgeShort"), path: "/knowledge-base", requiredPermission: ["view_article", "manage_article"] },
            { name: t("manualShort"), path: "/manual", requiredPermission: ["view_manual", "manage_manual"] },
          ],
        },
        { icon: <FolderIcon />, name: t("servicesNav"), path: "/services", requiredPermission: "manage_service" },
        { icon: <PieChartIcon />, name: t("reports"), path: "/reports", requiredPermission: ["view_own_report", "view_all_report"] },
      ],
    },
    {
      title: t("systemMenu"),
      items: [
        {
          icon: <LockIcon />,
          name: t("accessControl"),
          subItems: [
            { name: "Users", path: "/users", requiredPermission: ["view_user"] },
            { name: "Roles", path: "/roles", requiredPermission: ["view_role"] },
          ],
        },
        { icon: <SettingsIcon />, name: t("siteSettings"), path: "/settings", requiredPermission: ["view_setting"] },
        { icon: <UserIcon />, name: t("myProfile"), path: "/profile", requiredPermission: ["view_myprofile"] },
      ],
    },
  ], [t, hasPermission]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    groupIndex: number;
    itemIndex: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filteredNavGroups = useMemo(() => {
    return sidebarGroups.map((group) => {
      const filteredItems = group.items.map((item) => {
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter((subItem) => {
            if (!subItem.requiredPermission) return true;
            return hasPermission(subItem.requiredPermission);
          });

          if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
            return null;
          }

          return filteredSubItems.length > 0
            ? { ...item, subItems: filteredSubItems }
            : null;
        }

        if (!item.requiredPermission) return item;
        return hasPermission(item.requiredPermission) ? item : null;
      }).filter((item): item is NavItem => item !== null);

      return filteredItems.length > 0 ? { ...group, items: filteredItems } : null;
    }).filter((group): group is NavGroup => group !== null);
  }, [hasPermission, sidebarGroups]);

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return location.pathname === "/" || location.pathname === "/dashboard";
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    },
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    filteredNavGroups.forEach((group, groupIndex) => {
      group.items.forEach((nav, itemIndex) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                groupIndex,
                itemIndex,
              });
              submenuMatched = true;
            }
          });
        }
        if (nav.path && isActive(nav.path)) {
          submenuMatched = true;
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, filteredNavGroups]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.groupIndex}-${openSubmenu.itemIndex}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (groupIndex: number, itemIndex: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.groupIndex === groupIndex &&
        prevOpenSubmenu.itemIndex === itemIndex
      ) {
        return null;
      }
      return { groupIndex, itemIndex };
    });
  };

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const renderMenuItems = (items: NavItem[], groupIndex: number) => (
    <ul className="flex flex-col gap-1.5">
      {items.map((nav, itemIndex) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(groupIndex, itemIndex)}
              className={`menu-item group ${
                openSubmenu?.groupIndex === groupIndex && openSubmenu?.itemIndex === itemIndex
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.groupIndex === groupIndex && openSubmenu?.itemIndex === itemIndex
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {showLabels && <span className="menu-item-text">{nav.name}</span>}
              {showLabels && (
                <ChevronDownIcon
                  className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                    openSubmenu?.groupIndex === groupIndex && openSubmenu?.itemIndex === itemIndex
                      ? "rotate-180 text-brand-600"
                      : "text-gray-400"
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {showLabels && <span className="menu-item-text">{nav.name}</span>}
              </Link>
            )
          )}
          {nav.subItems && showLabels && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${groupIndex}-${itemIndex}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.groupIndex === groupIndex && openSubmenu?.itemIndex === itemIndex
                    ? `${subMenuHeight[`${groupIndex}-${itemIndex}`]}px`
                    : "0px",
              }}
            >
              <ul className="ml-9 mt-1.5 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 h-screen transition-all duration-300 ease-in-out z-[900] border-r border-brand-100 bg-white text-gray-900 dark:border-white/8 dark:bg-[#161922] dark:text-gray-100
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`-mx-4 border-b border-brand-100/80 bg-gradient-to-b from-brand-50 to-white px-5 py-4 dark:border-white/8 dark:from-[#161922] dark:to-[#161922] ${
          showLabels ? "" : "flex justify-center"
        }`}
      >
        <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-brand-100 dark:bg-white/[0.06] dark:ring-white/10 dark:shadow-none">
            <AppLogo isSquare className="h-8 w-8" />
          </span>
          {showLabels && (
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100">
                {siteName}
              </span>
              <span className="mt-1.5 block h-[3px] w-7 rounded-full bg-brand-500 dark:bg-brand-500/70" aria-hidden="true" />
            </span>
          )}
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 pt-4">
          <div className="flex flex-col gap-4">
            {filteredNavGroups.map((group, groupIndex) => (
              <div key={group.title} className={groupIndex > 0 ? "mt-4" : ""}>
                <h2
                  className={`mb-3.5 flex text-xs font-semibold uppercase leading-[20px] tracking-wider text-gray-400 dark:text-gray-500 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    group.title
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(group.items, groupIndex)}
              </div>
            ))}
          </div>
        </nav>
      </div>
      {user && showLabels && (
        <div className="mb-4 mt-auto flex items-center gap-3 border-t border-brand-100/80 px-1 pt-4 dark:border-gray-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
            {(() => {
              const parts = (user.fullname || "").trim().split(/\s+/).filter(Boolean);
              if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
              return (user.fullname || user.username || "U").slice(0, 2).toUpperCase();
            })()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-gray-800 dark:text-white">{user.fullname || user.username}</span>
            <span className="block truncate text-xs text-gray-500">{user.email}</span>
          </span>
          <button
            type="button"
            aria-label="Keluar"
            onClick={() => {
              logout();
              navigate("/signin");
            }}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-brand-50 hover:text-brand-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;

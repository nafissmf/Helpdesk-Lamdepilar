type PermissionHolder = {
  permissions?: { name: string }[];
  roles?: { permissions?: { name: string }[] }[];
};

export function userHasPermission(
  user: PermissionHolder | null | undefined,
  permission: string | string[]
): boolean {
  if (!user) return false;
  const names = new Set<string>();
  user.permissions?.forEach((p) => names.add(p.name));
  user.roles?.forEach((role) => role.permissions?.forEach((p) => names.add(p.name)));
  if (names.size === 0) return false;
  const required = Array.isArray(permission) ? permission : [permission];
  return required.some((perm) => names.has(perm));
}

/** Ordered candidates for post-login / fallback navigation. */
const HOME_CANDIDATES: { path: string; permission: string | string[] }[] = [
  { path: "/", permission: "view_dashboard" },
  { path: "/dashboard", permission: "view_dashboard" },
  { path: "/tickets", permission: ["view_own_ticket", "view_all_ticket"] },
  { path: "/knowledge-base", permission: ["view_article", "manage_article"] },
  { path: "/manual", permission: ["view_manual", "manage_manual"] },
  { path: "/reports", permission: ["view_own_report", "view_all_report"] },
  { path: "/profile", permission: "view_myprofile" },
];

/** Route permission map for validating redirect targets. */
const ROUTE_PERMISSIONS: { prefix: string; permission: string | string[] }[] = [
  { prefix: "/users", permission: "view_user" },
  { prefix: "/roles", permission: "view_role" },
  { prefix: "/units", permission: "view_unit" },
  { prefix: "/role-scopes", permission: "view_role_scope" },
  { prefix: "/settings", permission: "view_setting" },
  { prefix: "/tickets", permission: ["view_own_ticket", "view_all_ticket"] },
  { prefix: "/knowledge-base", permission: ["view_article", "manage_article"] },
  { prefix: "/manual", permission: ["view_manual", "manage_manual"] },
  { prefix: "/reports", permission: ["view_own_report", "view_all_report"] },
  { prefix: "/profile", permission: "view_myprofile" },
  { prefix: "/dashboard", permission: "view_dashboard" },
  { prefix: "/", permission: "view_dashboard" },
];

type HasPermission = (permission: string | string[]) => boolean;

export function getDefaultHomePath(hasPermission: HasPermission): string {
  for (const item of HOME_CANDIDATES) {
    if (hasPermission(item.permission)) return item.path;
  }
  return "/profile";
}

export function canAccessPath(pathname: string, hasPermission: HasPermission): boolean {
  if (!pathname || pathname === "/signin" || pathname === "/signup") return false;
  const match = ROUTE_PERMISSIONS.find(
    (item) => pathname === item.prefix || (item.prefix !== "/" && pathname.startsWith(item.prefix))
  );
  if (!match) return false;
  return hasPermission(match.permission);
}

export function resolvePostLoginPath(
  requestedPath: string | undefined,
  hasPermission: HasPermission
): string {
  if (requestedPath && canAccessPath(requestedPath, hasPermission)) {
    return requestedPath;
  }
  return getDefaultHomePath(hasPermission);
}

export function resolvePostLoginPathForUser(
  requestedPath: string | undefined,
  user: PermissionHolder | null | undefined
): string {
  return resolvePostLoginPath(requestedPath, (permission) => userHasPermission(user, permission));
}
